"use client";

import type { DocumentEditor } from "@/hooks/useDocumentEditor";
import { FileNameDialog } from "./FileNameDialog";
import { Win98Dialog } from "./Win98Dialog";

export function DocumentDialogs({ editor }: { editor: DocumentEditor }) {
  if (editor.saveAs) return <FileNameDialog title="Save to My Documents" name={editor.fileId ? editor.name.replace(/(\.[^.]+)$/, " copy$1") : editor.name} busy={editor.busy} error={editor.error} onSubmit={name => { void editor.persist(name, Boolean(editor.fileId)); }} onCancel={editor.cancel} />;
  if (!editor.pendingAction) return null;
  return <Win98Dialog title={editor.app} onCancel={() => { if (!editor.busy) editor.cancel(); }}>
    <p className="mb-4 break-words">Save changes to {editor.name}?</p>
    {editor.error && <p role="alert" className="mb-2 break-words text-[#800000]">{editor.error}</p>}
    <div className="flex flex-wrap justify-end gap-2">
      <button className="win-button" disabled={editor.busy} onClick={editor.save}>Save</button>
      <button className="win-button" disabled={editor.busy} onClick={() => { void editor.discard(); }}>Don&apos;t Save</button>
      <button className="win-button" disabled={editor.busy} onClick={editor.cancel}>Cancel</button>
    </div>
  </Win98Dialog>;
}
