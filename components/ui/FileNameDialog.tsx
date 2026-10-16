"use client";

import { useState } from "react";
import { Win98Dialog } from "./Win98Dialog";

export function FileNameDialog({ title, name, busy = false, error, onSubmit, onCancel }: { title: string; name: string; busy?: boolean; error?: string; onSubmit: (name: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(name);
  return <Win98Dialog title={title} onCancel={() => { if (!busy) onCancel(); }}>
    <form onSubmit={event => { event.preventDefault(); if (!busy) onSubmit(value); }}>
      <label className="block">File name<input aria-label="File name" className="win-inset mt-1 w-full min-w-0 bg-white p-1 text-black" value={value} maxLength={100} disabled={busy} onChange={event => setValue(event.target.value)} /></label>
      {error && <p role="alert" className="mt-2 break-words text-[#800000]">{error}</p>}
      <div className="mt-4 flex justify-end gap-2"><button type="submit" className="win-button" disabled={busy || !value.trim()}>{busy ? "Saving..." : title === "Rename" ? "Rename" : "Save"}</button><button type="button" className="win-button" disabled={busy} onClick={onCancel}>Cancel</button></div>
    </form>
  </Win98Dialog>;
}
