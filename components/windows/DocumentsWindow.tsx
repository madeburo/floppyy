"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WindowComponentProps } from "@/lib/windows";
import { deleteFile, downloadFile, exportBackup, importBackup, listFiles, MAX_BACKUP_SIZE, parseBackup, renameFile, subscribeFiles, type PersonalFile } from "@/lib/personalFiles";
import { GameMenuBar } from "@/components/games/GameChrome";
import { Win98Dialog } from "@/components/ui/Win98Dialog";
import { FileNameDialog } from "@/components/ui/FileNameDialog";
import { ToolbarIcon } from "./ToolbarIcon";

const builtins = [
  { id: "clouds", name: "Clouds.bmp", icon: "painticon", description: "Bitmap image" },
  { id: "aol-url", name: "AOL.url", icon: "url", description: "Internet shortcut" },
  { id: "readme", name: "README.txt", icon: "notepad", description: "Text document" },
];

export function DocumentsWindow({ window: win, openWindow, closeWindow, playSound }: WindowComponentProps) {
  const [files, setFiles] = useState<PersonalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState<{ raw: string; count: number } | null>(null);
  const [details, setDetails] = useState(false);
  const [status, setStatus] = useState("This browser");
  const importRef = useRef<HTMLInputElement>(null);
  const selectedFile = files.find(file => file.id === selected);
  const items = [...builtins, ...files.map(file => ({ id: file.id, name: file.name, icon: file.kind === "text" ? "notepad" : "painticon", description: file.kind === "text" ? "Text document" : "PNG image" }))];
  const selectedItem = items.find(item => item.id === selected);

  const refresh = useCallback(async () => {
    try { setFiles((await listFiles()).sort((a, b) => a.name.localeCompare(b.name))); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load files."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    const update = () => { if (active) void refresh(); };
    update();
    const unsubscribe = subscribeFiles(update);
    return () => { active = false; unsubscribe(); };
  }, [refresh]);

  const openItem = (id: string) => {
    playSound("open");
    const file = files.find(item => item.id === id);
    if (file) openWindow(file.kind === "text" ? "notepad" : "paint", `file:${file.id}`);
    else if (id === "clouds") openWindow("paint", "clouds");
    else if (id === "aol-url") openWindow("ie-browser", "https://www.aol.com/");
    else if (id === "readme") openWindow("notepad", "readme");
  };

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError("");
    try { await action(); setDialog(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The operation failed."); }
    finally { setBusy(false); }
  };
  const downloadBackup = () => run(async () => { downloadFile("Floppyy.floppyy.json", await exportBackup(), "backup"); setStatus("Backup downloaded"); });
  const downloadSelected = () => { if (selectedFile) downloadFile(selectedFile.name, selectedFile.content, selectedFile.kind); };

  return <div className="documents-editor relative flex h-full min-w-0 flex-col bg-[#c0c0c0] text-[11px]" onKeyDown={event => {
    if (dialog || backup || event.target instanceof HTMLInputElement) return;
    if (event.key === "F2" && selectedFile) { event.preventDefault(); setDialog("rename"); }
    if (event.key === "Delete" && selectedFile) { event.preventDefault(); setDialog("delete"); }
  }}>
    <GameMenuBar items={[
      { label: "File", menu: [
        { label: "New Text Document", onClick: () => openWindow("notepad", `new:${crypto.randomUUID()}`) },
        { label: "New Drawing", onClick: () => openWindow("paint", `new:${crypto.randomUUID()}`) },
        { label: "Open", disabled: !selected, onClick: () => { if (selected) openItem(selected); } },
        { label: "Rename...", disabled: !selectedFile, onClick: () => setDialog("rename") },
        { label: "Delete...", disabled: !selectedFile, onClick: () => setDialog("delete") },
        { label: "Download", disabled: !selectedFile, onClick: downloadSelected },
        { label: "Export Backup...", separatorBefore: true, onClick: () => { void downloadBackup(); }, disabled: busy || loading },
        { label: "Restore Backup...", onClick: () => importRef.current?.click(), disabled: busy || loading },
        { label: "Close", separatorBefore: true, onClick: () => closeWindow(win.instanceId) },
      ] },
      { label: "View", menu: [{ label: "Large Icons", checked: !details, onClick: () => setDetails(false) }, { label: "Details", checked: details, onClick: () => setDetails(true) }, { label: "Refresh", onClick: () => { void refresh(); } }] },
    ]} />
    <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#808080] p-1" role="toolbar" aria-label="File actions">
      {[
        { label: "Open", icon: "up", disabled: !selected, action: () => { if (selected) openItem(selected); } },
        { label: "Rename", icon: "properties", disabled: !selectedFile, action: () => setDialog("rename") },
        { label: "Delete", icon: "delete", disabled: !selectedFile, action: () => setDialog("delete") },
        { label: "Views", icon: "views", disabled: false, action: () => setDetails(value => !value) },
        { label: "Refresh", icon: "refresh", disabled: false, action: () => { void refresh(); } },
      ].map(button => <button key={button.label} title={button.label} aria-label={button.label} disabled={busy || button.disabled} onClick={button.action} className="flex h-9 w-9 shrink-0 items-center justify-center disabled:opacity-40"><ToolbarIcon name={button.icon} /></button>)}
    </div>
    <div className="flex shrink-0 items-center gap-2 px-2 py-1"><b>Address</b><div className="win-inset flex min-w-0 flex-1 items-center gap-1 bg-white px-1 py-0.5"><img src="/icons/documents.png" alt="" width={16} height={16} />My Documents</div></div>
    <div className="flex min-h-0 flex-1 border-t border-[#808080] bg-white">
      <aside className="documents-sidebar w-[140px] shrink-0 border-r border-[#c0c0c0] bg-[#eefaff] p-3">
        <img src="/icons/documents.png" alt="" width={32} height={32} draggable={false} style={{ imageRendering: "pixelated" }} />
        <h2 className="mt-2 text-[16px] font-bold">My Documents</h2>
        <p className="mt-3 break-words">{selectedItem?.name ?? `${files.length} personal ${files.length === 1 ? "file" : "files"}`}</p>
        <p className="mt-1 text-[#555]">{selectedItem?.description ?? "This browser"}</p>
      </aside>
      <div className="min-w-0 flex-1 overflow-auto p-2" onClick={() => setSelected(null)}>
        <div className={details ? "flex flex-col" : "grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] content-start gap-2"}>
          {items.map(item => <button key={item.id} aria-label={item.name} aria-pressed={selected === item.id}
            className={`min-w-0 p-2 text-left ${details ? "flex items-center gap-2" : "flex min-h-[80px] flex-col items-center gap-1 text-center"} ${selected === item.id ? "bg-[#000080] text-white" : "text-black"}`}
            onClick={event => { event.stopPropagation(); setSelected(item.id); }} onDoubleClick={() => openItem(item.id)}
            onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); openItem(item.id); } }}>
            <img src={`/icons/${item.icon}.png`} alt="" width={details ? 20 : 32} height={details ? 20 : 32} draggable={false} style={{ imageRendering: "pixelated" }} />
            <span className="max-w-full break-all leading-tight">{item.name}</span>
            {details && <span className="ml-auto hidden shrink-0 text-[10px] sm:block">{item.description}</span>}
          </button>)}
        </div>
      </div>
    </div>
    {error && <p role="alert" className="bg-[#ffffcc] p-2 text-[#800000]">{error}</p>}
    <div className="status-bar"><p className="status-bar-field">{loading ? "Loading..." : `${items.length} object(s)`}</p><p className="status-bar-field">{status}</p></div>
    <input ref={importRef} type="file" accept=".json,.floppyy.json,application/json" aria-label="Restore backup file" className="hidden" onChange={event => {
      const file = event.target.files?.[0]; event.target.value = "";
      if (!file) return;
      void run(async () => {
        if (file.size > MAX_BACKUP_SIZE) throw new Error("The backup is too large (48 MB maximum).");
        const raw = await file.text(); const parsed = parseBackup(raw);
        setBackup({ raw, count: parsed.length });
      });
    }} />
    {dialog === "rename" && selectedFile && <FileNameDialog title="Rename" name={selectedFile.name} error={error} busy={busy} onCancel={() => setDialog(null)} onSubmit={name => { void run(() => renameFile(selectedFile, name)); }} />}
    {dialog === "delete" && selectedFile && <Win98Dialog title="Delete File" onCancel={() => { if (!busy) setDialog(null); }}><p className="break-words">Delete {selectedFile.name}?</p><div className="mt-4 flex justify-end gap-2"><button className="win-button" disabled={busy} onClick={() => { void run(async () => { await deleteFile(selectedFile); setSelected(null); }); }}>Delete</button><button className="win-button" disabled={busy} onClick={() => setDialog(null)}>Cancel</button></div></Win98Dialog>}
    {backup && <Win98Dialog title="Restore Backup" onCancel={() => { if (!busy) setBackup(null); }}><p>Restore {backup.count} files? Existing files will be kept.</p>{error && <p role="alert" className="mt-2 text-[#800000]">{error}</p>}<div className="mt-4 flex justify-end gap-2"><button className="win-button" disabled={busy} onClick={() => { void run(async () => { const count = await importBackup(backup.raw); setStatus(`${count} files restored`); setBackup(null); }); }}>{busy ? "Restoring..." : "Restore"}</button><button className="win-button" disabled={busy} onClick={() => setBackup(null)}>Cancel</button></div></Win98Dialog>}
  </div>;
}
