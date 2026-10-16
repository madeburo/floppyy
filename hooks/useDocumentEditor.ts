"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { downloadFile, fileName, getDraft, getFile, saveFile, writeDraft, type EditorDraft, type FileKind } from "@/lib/personalFiles";
import type { WindowComponentProps } from "@/lib/windows";

export function useDocumentEditor(props: WindowComponentProps, kind: FileKind, initialContent = "") {
  const { window: win, registerCloseGuard, setDocumentIdentity } = props;
  const app = kind === "text" ? "Notepad" : "Paint";
  const creating = win.payload?.startsWith("new:") ?? false;
  const source = creating ? "" : win.payload ?? "";
  const initialName = kind === "text" ? "Untitled.txt" : "Untitled.png";
  const [document, setDocument] = useState<EditorDraft>({ name: initialName, kind, source, content: initialContent, savedContent: initialContent });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [generation, setGeneration] = useState(0);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [saveAs, setSaveAs] = useState(false);
  const draftSequence = useRef(0);
  const mounted = useRef(true);
  const dirty = document.content !== document.savedContent;

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    Promise.all([creating ? writeDraft(kind).then(() => undefined) : getDraft(kind, source), source.startsWith("file:") ? getFile(source.slice(5)) : Promise.resolve(undefined)])
      .then(([draft, file]) => {
        if (cancelled) return;
        if (source.startsWith("file:") && (!file || file.kind !== kind)) throw new Error("This file is no longer available. Create a new document to continue.");
        let next: EditorDraft = file
          ? { ...file, source, fileId: file.id, savedContent: file.content }
          : { name: initialName, kind, source, content: initialContent, savedContent: initialContent };
        if (draft?.source === source) next = draft;
        else if (kind === "text" && !file && !creating) {
          try { next.content = localStorage.getItem(`floppyy-notepad-${source || "untitled"}`) ?? initialContent; } catch { /* IndexedDB remains the primary store. */ }
        }
        setDocument(next);
        setLoading(false);
        if (next.content !== next.savedContent) setDraftStatus("Draft restored");
        if (file) setDocumentIdentity?.(win.instanceId, `${next.name} - ${app}`, source);
        if (creating) {
          try { if (kind === "text") localStorage.removeItem("floppyy-notepad-untitled"); } catch { /* ignore */ }
          setDocumentIdentity?.(win.instanceId, `${kind === "text" ? "Untitled" : "untitled"} - ${app}`);
        }
      })
      .catch(reason => { if (!cancelled) { setError(reason instanceof Error ? reason.message : "Could not open browser storage."); setLoading(false); } });
    return () => { cancelled = true; mounted.current = false; };
  }, [app, creating, initialContent, initialName, kind, setDocumentIdentity, source, win.instanceId]);

  const changeContent = useCallback((content: string) => {
    const next = { ...document, content };
    setDocument(next);
    const sequence = ++draftSequence.current;
    setDraftStatus("Saving draft...");
    void writeDraft(next).then(() => {
      if (mounted.current && sequence === draftSequence.current) { setDraftStatus("Draft saved"); setError(""); }
    }).catch(reason => {
      if (mounted.current && sequence === draftSequence.current) { setDraftStatus("Draft not saved"); setError(reason instanceof Error ? reason.message : "Could not autosave."); }
    });
  }, [document]);

  const requestAction = useCallback((proceed: () => void) => {
    if (busy || loading) return;
    if (dirty) setPendingAction(() => proceed);
    else proceed();
  }, [busy, dirty, loading]);

  useEffect(() => registerCloseGuard?.(win.instanceId, requestAction), [registerCloseGuard, requestAction, win.instanceId]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const persist = useCallback(async (name: string, copy = false) => {
    setBusy(true); setError("");
    try {
      const file = await saveFile({ name, kind, content: document.content, id: copy ? undefined : document.fileId, revision: document.revision, draftSource: source });
      try { if (kind === "text") localStorage.removeItem(`floppyy-notepad-${source || "untitled"}`); } catch { /* Legacy drafts are only a migration source. */ }
      setDocument({ ...file, source: `file:${file.id}`, fileId: file.id, savedContent: file.content });
      setDraftStatus("Saved to My Documents"); setSaveAs(false); setPendingAction(null);
      // A pending close/new/open owns the next window identity; avoid remounting the saved file first.
      if (!pendingAction) setDocumentIdentity?.(win.instanceId, `${file.name} - ${app}`, `file:${file.id}`);
      pendingAction?.();
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save. Your work is still open.");
      return false;
    } finally { setBusy(false); }
  }, [app, document, kind, pendingAction, setDocumentIdentity, source, win.instanceId]);

  const save = useCallback(() => {
    if (loading || busy) return;
    if (document.fileId) void persist(document.name);
    else setSaveAs(true);
  }, [busy, document.fileId, document.name, loading, persist]);

  const discard = useCallback(async () => {
    setBusy(true);
    try {
      await writeDraft(kind, source);
      try { if (kind === "text") localStorage.removeItem(`floppyy-notepad-${source || "untitled"}`); } catch { /* ignore */ }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not discard this draft."); }
    finally { setPendingAction(null); pendingAction?.(); setBusy(false); }
  }, [kind, pendingAction, source]);

  const newDocument = useCallback(() => requestAction(() => {
    setError("");
    void writeDraft(kind, source).catch(reason => {
      setError(reason instanceof Error ? reason.message : "Browser storage is unavailable.");
    }).finally(() => {
      setDocument({ kind, name: initialName, source: "", content: "", savedContent: "" });
      setDocumentIdentity?.(win.instanceId, `${kind === "text" ? "Untitled" : "untitled"} - ${app}`);
      setGeneration(value => value + 1); setDraftStatus("");
    });
  }), [app, initialName, kind, requestAction, setDocumentIdentity, source, win.instanceId]);

  const download = useCallback(() => {
    try { downloadFile(fileName(document.name, kind), document.content, kind); }
    catch { setError("Could not download this file."); }
  }, [document, kind]);

  return { ...document, dirty, loading, busy, error, draftStatus, generation, changeContent, save, persist, download, newDocument, saveAs, setSaveAs, pendingAction, discard, cancel: () => { setSaveAs(false); setPendingAction(null); }, app };
}

export type DocumentEditor = ReturnType<typeof useDocumentEditor>;
