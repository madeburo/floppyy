"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { WindowComponentProps } from "@/lib/windows";
import { Win98Dialog } from "@/components/ui/Win98Dialog";

type MenuActionId =
  | "new"
  | "save"
  | "exit"
  | "undo"
  | "cut"
  | "copy"
  | "paste"
  | "selectAll"
  | "timeDate"
  | "find"
  | "about"
  | "wordWrap";

type MenuItem = { label: string; action: MenuActionId; disabled?: boolean };

const DOCUMENT_TEXT: Record<string, string> = {
  readme: `Welcome to Floppyy!

Floppyy is a retro computer in your browser, built from good old internet memories.

Open windows, play a game, listen to Winamp, explore the disks, or connect through dial-up at a blazing 33.6 kbps. Nothing here is trying to make you more productive. That is the point.

It is not an emulator and it does not need a manual. Just click around and see what you remember.

The web you grew up on.

www.floppyy.com`,
};

// Static menu structure — labels and action ids only. No closures or refs flow
// through here, so it is safe to map over during render.
const MENU_ITEMS: Record<string, MenuItem[]> = {
  File: [
    { label: "New", action: "new" },
    { label: "Save", action: "save" },
    { label: "Exit", action: "exit" },
  ],
  Edit: [
    { label: "Undo", action: "undo", disabled: true },
    { label: "Cut", action: "cut" },
    { label: "Copy", action: "copy" },
    { label: "Paste", action: "paste" },
    { label: "Select All", action: "selectAll" },
    { label: "Time/Date", action: "timeDate" },
  ],
  Search: [{ label: "Find...", action: "find", disabled: true }],
  Format: [{ label: "Word Wrap", action: "wordWrap" }],
  Help: [{ label: "About Notepad", action: "about" }],
};

function readDraft(payload?: string) {
  try { return localStorage.getItem(`floppyy-notepad-${payload ?? "untitled"}`) ?? DOCUMENT_TEXT[payload ?? ""] ?? ""; }
  catch { return DOCUMENT_TEXT[payload ?? ""] ?? ""; }
}

export function NotepadWindow({ window: win, closeWindow, registerCloseGuard, notify, playSound }: WindowComponentProps) {
  const [text, setText] = useState(() => readDraft(win.payload));
  const [savedText, setSavedText] = useState(() => DOCUMENT_TEXT[win.payload ?? ""] ?? "");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const draftKey = `floppyy-notepad-${win.payload ?? "untitled"}`;
  const dirty = text !== savedText;
  const [wordWrap, setWordWrap] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const requestAction = useCallback((proceed: () => void) => {
    if (dirty) setPendingAction(() => proceed);
    else proceed();
  }, [dirty]);

  useEffect(() => registerCloseGuard?.(win.instanceId, requestAction), [registerCloseGuard, requestAction, win.instanceId]);
  useEffect(() => {
    try { localStorage.setItem(draftKey, text); } catch { /* The save dialog still allows downloading. */ }
  }, [draftKey, text]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCallback(() => {
    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const name = (win.title || "Untitled").replace(/\s*-\s*Notepad$/i, "").trim() || "Untitled";
      const link = document.createElement("a");
      link.href = url;
      link.download = name.toLowerCase().endsWith(".txt") ? name : `${name}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSavedText(text);
      playSound("click");
      return true;
    } catch {
      notify("Save failed. Your draft is still open.");
      return false;
    }
  }, [notify, playSound, text, win.title]);

  const runAction = useCallback(
    (action: MenuActionId) => {
      const textarea = textareaRef.current;
      switch (action) {
        case "new": {
          requestAction(() => { setText(""); setSavedText(""); playSound("click"); });
          break;
        }
        case "save": {
          save();
          break;
        }
        case "exit": {
          closeWindow(win.instanceId);
          break;
        }
        case "undo": {
          playSound("error");
          break;
        }
        case "cut": {
          if (!textarea) return;
          const selected = text.substring(textarea.selectionStart, textarea.selectionEnd);
          if (selected) {
            const next = text.substring(0, textarea.selectionStart) + text.substring(textarea.selectionEnd);
            navigator.clipboard.writeText(selected)
              .then(() => setText((current) => current === text ? next : current))
              .catch(() => notify("Cannot cut to clipboard. Your text has not been changed."));
          }
          playSound("click");
          break;
        }
        case "copy": {
          if (!textarea) return;
          const selected = text.substring(textarea.selectionStart, textarea.selectionEnd);
          if (selected) {
            navigator.clipboard.writeText(selected).catch(() => {});
            notify("Copied to clipboard.");
          }
          playSound("click");
          break;
        }
        case "paste": {
          if (!textarea) return;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          navigator.clipboard
            .readText()
            .then((clipText) => setText(text.substring(0, start) + clipText + text.substring(end)))
            .catch(() => notify("Cannot paste from clipboard."));
          playSound("click");
          break;
        }
        case "selectAll": {
          textarea?.select();
          playSound("click");
          break;
        }
        case "timeDate": {
          if (!textarea) return;
          const now = new Date();
          const stamp = `${now.toLocaleTimeString()} ${now.toLocaleDateString()}`;
          const at = textarea.selectionStart;
          setText(text.substring(0, at) + stamp + text.substring(at));
          playSound("click");
          break;
        }
        case "find": {
          notify("Find is not implemented yet.");
          playSound("error");
          break;
        }
        case "about": {
          notify("Notepad for Floppyy. A simple text editor.");
          playSound("click");
          break;
        }
        case "wordWrap": {
          setWordWrap((value) => !value);
          playSound("click");
          break;
        }
      }
    },
    [text, notify, playSound, closeWindow, win.instanceId, requestAction, save],
  );

  return (
    <div className="relative flex h-full flex-col" onClick={() => setOpenMenu(null)}>
      <div className="window-menu-bar">
        {Object.keys(MENU_ITEMS).map((menu) => (
          <div key={menu} className="relative" style={{ display: "inline-block" }}>
            <button
              className="window-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === menu ? null : menu);
              }}
              onMouseEnter={() => {
                if (openMenu) setOpenMenu(menu);
              }}
            >
              {menu}
            </button>
            {openMenu === menu && (
              <div
                className="absolute left-0 top-full z-50 min-w-[160px] border border-[#808080] bg-[#c0c0c0] py-[2px] shadow-md"
                style={{ display: "flex", flexDirection: "column" }}
                onClick={(e) => e.stopPropagation()}
              >
                {MENU_ITEMS[menu].map((item) => (
                  <button
                    key={item.action}
                    className="menu-command"
                    disabled={item.disabled}
                    aria-disabled={item.disabled}
                    onClick={() => {
                      runAction(item.action);
                      setOpenMenu(null);
                    }}
                  >
                    {item.action === "wordWrap" && (wordWrap ? "✓ " : "  ")}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1 p-0">
        <textarea
          ref={textareaRef}
          className="notepad-textarea h-full w-full resize-none border-0 bg-white p-1 outline-none"
          style={{
            fontFamily: "Menlo, Monaco, Consolas, \"Lucida Console\", \"Courier New\", monospace",
            lineHeight: "1.35",
            color: "#000000",
            whiteSpace: wordWrap ? "pre-wrap" : "pre",
            overflowWrap: wordWrap ? "break-word" : "normal",
            overflowX: wordWrap ? "hidden" : "auto",
          }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          aria-label="Text editor"
        />
      </div>
      {pendingAction && (
        <Win98Dialog title="Notepad" onCancel={() => setPendingAction(null)}>
          <p className="mb-4">Save changes to this document?</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button className="win-button" onClick={() => { if (save()) { setPendingAction(null); pendingAction(); } }}>Save</button>
            <button className="win-button" onClick={() => {
              try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
              setPendingAction(null); pendingAction();
            }}>Don&apos;t Save</button>
            <button className="win-button" onClick={() => setPendingAction(null)}>Cancel</button>
          </div>
        </Win98Dialog>
      )}
    </div>
  );
}
