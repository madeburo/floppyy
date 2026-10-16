export type FileKind = "text" | "image";
export type FileContent = { name: string; kind: FileKind; content: string };
export type PersonalFile = FileContent & { id: string; nameKey: string; revision: string; updatedAt: number };
export type EditorDraft = FileContent & { kind: FileKind; source: string; fileId?: string; revision?: string; savedContent: string };

export const MAX_FILE_SIZE = 6 * 1024 * 1024;
export const MAX_BACKUP_SIZE = 48 * 1024 * 1024;
const MAX_FILES = 200;
const RESERVED = new Set(["clouds.bmp", "aol.url", "readme.txt"]);
const CHANGE_EVENT = "floppyy-files-changed";
const encoder = new TextEncoder();
let database: Promise<IDBDatabase> | undefined;

export function fileName(name: string, kind: FileKind): string {
  const trimmed = name.trim();
  const extension = kind === "text" ? ".txt" : ".png";
  const normalized = trimmed.toLowerCase().endsWith(extension) ? trimmed : `${trimmed}${extension}`;
  if (!trimmed || normalized.length > 100 || /[<>:"/\\|?*\u0000-\u001f]/.test(trimmed) || /[. ]$/.test(trimmed)) {
    throw new Error("Enter a file name without slashes or special characters (up to 100 characters).");
  }
  return normalized;
}

export function validateContent(value: unknown): FileContent {
  if (!value || typeof value !== "object") throw new Error("Invalid file.");
  const item = value as Partial<FileContent>;
  if ((item.kind !== "text" && item.kind !== "image") || typeof item.name !== "string" || typeof item.content !== "string") {
    throw new Error("This backup contains an unsupported file.");
  }
  if (encoder.encode(item.content).length > MAX_FILE_SIZE) throw new Error("A file is too large (6 MB maximum).");
  if (item.kind === "image") {
    if (!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(item.content)) throw new Error("Only PNG images are supported.");
    const header = atob(item.content.slice(22, 66));
    if (!header.startsWith("\x89PNG\r\n\x1a\n") || header.slice(12, 16) !== "IHDR") throw new Error("Invalid PNG image.");
    const size = new DataView(Uint8Array.from(header, c => c.charCodeAt(0)).buffer);
    const width = size.getUint32(16), height = size.getUint32(20);
    if (!width || !height || width > 4096 || height > 4096 || width * height > 4_194_304) throw new Error("Image dimensions are too large.");
  }
  return { name: fileName(item.name, item.kind), kind: item.kind, content: item.content };
}

export function parseBackup(raw: string): FileContent[] {
  if (encoder.encode(raw).length > MAX_BACKUP_SIZE) throw new Error("The backup is too large (48 MB maximum).");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error("This is not a valid Floppyy backup."); }
  const backup = value as { format?: string; version?: number; files?: unknown[] } | null;
  if (!backup || backup.format !== "floppyy-files" || backup.version !== 1 || !Array.isArray(backup.files) || backup.files.length > MAX_FILES) {
    throw new Error("This is not a supported Floppyy backup.");
  }
  return backup.files.map(validateContent);
}

function openDatabase(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("floppyy-personal-files", 1);
      request.onupgradeneeded = () => {
        const files = request.result.createObjectStore("files", { keyPath: "id" });
        files.createIndex("nameKey", "nameKey", { unique: true });
        request.result.createObjectStore("drafts", { keyPath: "key" });
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); database = undefined; };
        resolve(request.result);
      };
      request.onerror = () => reject(new Error("Browser storage is unavailable. Your work is still open."));
      request.onblocked = () => reject(new Error("Close other Floppyy tabs and try again."));
    }).catch(error => { database = undefined; throw error; });
  }
  return database;
}

async function read<T>(store: string, key?: string): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = key === undefined ? tx.objectStore(store).getAll() : tx.objectStore(store).get(key);
    tx.oncomplete = () => resolve(request.result as T);
    tx.onabort = () => reject(tx.error ?? new Error("Could not read browser storage."));
  });
}

function changed() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
  try { const channel = new BroadcastChannel(CHANGE_EVENT); channel.postMessage("changed"); channel.close(); } catch { /* Same-tab updates still work. */ }
}

export function subscribeFiles(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  const refresh = () => { if (!document.hidden) listener(); };
  document.addEventListener("visibilitychange", refresh);
  let channel: BroadcastChannel | undefined;
  try { channel = new BroadcastChannel(CHANGE_EVENT); channel.onmessage = listener; } catch { /* Optional cross-tab notification. */ }
  return () => { window.removeEventListener(CHANGE_EVENT, listener); document.removeEventListener("visibilitychange", refresh); channel?.close(); };
}

export const listFiles = () => read<PersonalFile[]>("files");
export const getFile = (id: string) => read<PersonalFile | undefined>("files", id);
export const getDraft = (kind: FileKind, source = "") => read<EditorDraft | undefined>("drafts", `${kind}:${source}`);

export async function writeDraft(draft: EditorDraft | FileKind, source = ""): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite");
    if (typeof draft === "string") tx.objectStore("drafts").delete(`${draft}:${source}`);
    else {
      if (encoder.encode(draft.content).length > MAX_FILE_SIZE) { reject(new Error("Draft is too large to autosave.")); return; }
      tx.objectStore("drafts").put({ ...draft, key: `${draft.kind}:${draft.source}` });
    }
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(new Error("Could not autosave. Download your work before closing."));
  });
}

// Read and validate inside the write transaction so two tabs cannot overwrite silently.
async function editFiles<T>(edit: (files: PersonalFile[], store: IDBObjectStore, drafts: IDBObjectStore) => T): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["files", "drafts"], "readwrite");
    const store = tx.objectStore("files");
    const request = store.getAll();
    let result: T;
    let failure: unknown;
    request.onsuccess = () => {
      try { result = edit(request.result, store, tx.objectStore("drafts")); }
      catch (error) { failure = error; tx.abort(); }
    };
    tx.oncomplete = () => { changed(); resolve(result); };
    tx.onabort = () => reject(failure ?? new Error("Could not save to browser storage. Download a backup or free some space."));
  });
}

function availableName(name: string, files: PersonalFile[], id?: string) {
  if (RESERVED.has(name.toLowerCase()) || files.some(f => f.id !== id && f.nameKey === name.toLowerCase())) {
    throw new Error("A file with this name already exists. Choose another name.");
  }
}

function currentFile(files: PersonalFile[], id: string, revision: string | undefined) {
  const existing = files.find(f => f.id === id);
  if (!existing || existing.revision !== revision) throw new Error("This file changed or was deleted elsewhere. Use Save As to keep your copy.");
  return existing;
}

function checkCapacity(files: FileContent[]) {
  // Reserve room for names and JSON escaping so every saved disk can be exported and restored.
  const size = encoder.encode(JSON.stringify(files.map(({ kind, content }) => ({ kind, content })))).length;
  if (files.length > MAX_FILES || size + MAX_FILES * 650 + 1024 > MAX_BACKUP_SIZE) throw new Error("Your disk is full. Download a backup and remove files before saving.");
}

export async function saveFile(input: FileContent & { id?: string; revision?: string; draftSource?: string }): Promise<PersonalFile> {
  const content = validateContent(input);
  return editFiles((files, store, drafts) => {
    if (input.id) currentFile(files, input.id, input.revision);
    availableName(content.name, files, input.id);
    const others = files.filter(f => f.id !== input.id);
    checkCapacity([...others, content]);
    const file = { ...content, id: input.id ?? crypto.randomUUID(), nameKey: content.name.toLowerCase(), revision: crypto.randomUUID(), updatedAt: Date.now() };
    store.put(file);
    drafts.delete(`${content.kind}:${input.draftSource ?? (input.id ? `file:${input.id}` : "")}`);
    return file;
  });
}

export async function renameFile(file: PersonalFile, name: string): Promise<void> {
  const normalized = fileName(name, file.kind);
  return editFiles((files, store) => {
    const current = currentFile(files, file.id, file.revision);
    availableName(normalized, files, file.id);
    store.put({ ...current, name: normalized, nameKey: normalized.toLowerCase(), revision: crypto.randomUUID(), updatedAt: Date.now() });
  });
}

export async function deleteFile(file: PersonalFile): Promise<void> {
  return editFiles((files, store, drafts) => {
    currentFile(files, file.id, file.revision);
    store.delete(file.id);
    drafts.delete(`${file.kind}:file:${file.id}`);
  });
}

export async function exportBackup(): Promise<string> {
  const files = (await listFiles()).map(({ name, kind, content }) => ({ name, kind, content }));
  return JSON.stringify({ format: "floppyy-files", version: 1, files });
}

export async function importBackup(raw: string): Promise<number> {
  const incoming = parseBackup(raw);
  return editFiles((files, store) => {
    checkCapacity([...files, ...incoming]);
    const names = new Set([...RESERVED, ...files.map(f => f.nameKey)]);
    for (const item of incoming) {
      const extension = item.kind === "text" ? ".txt" : ".png";
      const stem = item.name.slice(0, -extension.length);
      let name = item.name, index = 2;
      while (names.has(name.toLowerCase())) {
        const suffix = ` (${index++})${extension}`;
        name = `${stem.slice(0, 100 - suffix.length)}${suffix}`;
      }
      names.add(name.toLowerCase());
      store.put({ ...item, name, nameKey: name.toLowerCase(), id: crypto.randomUUID(), revision: crypto.randomUUID(), updatedAt: Date.now() });
    }
    return incoming.length;
  });
}

export function downloadFile(name: string, content: string, kind: FileKind | "backup") {
  const blob = kind === "image" ? new Blob([Uint8Array.from(atob(content.slice(22)), c => c.charCodeAt(0))], { type: "image/png" }) : new Blob([content], { type: kind === "backup" ? "application/json" : "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
