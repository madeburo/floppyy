"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { commands, isUrl } from "@/lib/commands";
import type { WindowComponentProps, WindowId } from "@/lib/windows";

// Canonical commands offered in the Open dropdown (deduped from the aliases).
const RUN_SUGGESTIONS = [
  "about",
  "calc",
  "cmd",
  "computer",
  "control",
  "defrag",
  "doom",
  "games",
  "guestbook",
  "help",
  "ie",
  "minesweeper",
  "netscape",
  "notepad",
  "outlook",
  "paint",
  "projects",
  "screensaver",
  "solitaire",
  "winamp",
];

function readRunHistory(): string[] {
  try {
    const saved = globalThis.localStorage.getItem("floppyy-run-history");
    const history: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(history) ? history.filter((item): item is string => typeof item === "string" && item.trim().toLowerCase() !== "support") : [];
  } catch {
    return [];
  }
}

export function RunWindow({ window: win, openWindow, closeWindow, notify, playSound, startScreensaver, crashSystem }: WindowComponentProps) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>(readRunHistory);
  const [histOpen, setHistOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);
  const [menuRect, setMenuRect] = useState<{ left: number; top: number; width: number } | null>(null);

  const toggleMenu = () => {
    if (histOpen) {
      setHistOpen(false);
      return;
    }
    const el = comboRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setMenuRect({ left: r.left, top: r.bottom + 1, width: r.width });
    }
    setHistOpen(true);
  };

  const pick = (item: string) => {
    setValue(item);
    setHistOpen(false);
  };

  const remember = (command: string) => {
    const next = [command, ...history.filter((item) => item.toLowerCase() !== command.toLowerCase())].slice(0, 8);
    setHistory(next);
    globalThis.localStorage.setItem("floppyy-run-history", JSON.stringify(next));
  };

  const run = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    remember(trimmed);

    // Easter egg: classic "destroy the machine" commands take Floppyy down.
    const lowered = trimmed.toLowerCase();
    if (/(^|\s)(format|deltree|del|erase|rd|rmdir|fdisk)(\s|$)/.test(lowered) || lowered.includes("*.*")) {
      playSound("error");
      closeWindow(win.instanceId);
      crashSystem?.({ variant: "cascade" });
      return;
    }

    // URL → open in IE browser via archive.org
    if (isUrl(trimmed)) {
      openWindow("ie-browser", trimmed);
      closeWindow(win.instanceId);
      return;
    }

    const normalized = trimmed.toLowerCase();

    if (normalized === "commands" || normalized === "?") {
      notify("Commands: about, computer, winamp, ie, netscape, notepad, paint, calc, cmd, doom, projects, games, music, screensaver, defrag, help. Some old words still work.");
      return;
    }

    const easterEggs: Record<string, () => void> = {
      llama: () => {
        notify("It really whips the llama.");
        openWindow("music");
      },
      nostalgia: () => {
        notify("Loading good old internet memories...");
        openWindow("about", "welcome");
      },
      clouds: () => {
        openWindow("paint");
      },
      stars: () => {
        notify("Stars screensaver activated.");
        startScreensaver("stars");
      },
      floppyy: () => {
        notify("The floppy still works.");
        openWindow("about", "welcome");
      },
    };

    const easterEgg = easterEggs[normalized];
    if (easterEgg) {
      playSound("open");
      easterEgg();
      closeWindow(win.instanceId);
      return;
    }

    const command = commands[normalized];
    if (!command) {
      playSound("error");
      notify(`Cannot find '${trimmed}'. Make sure you typed the name correctly.`);
      return;
    }
    openWindow(command as WindowId);
    closeWindow(win.instanceId);
  };

  return (
    <form
      className="flex h-full flex-col gap-[12px] px-[6px] py-[4px] text-[11px]"
      onSubmit={(event) => {
        event.preventDefault();
        run();
      }}
    >
      <div className="flex items-start gap-[12px]">
        <img
          src="/icons/run.png"
          alt=""
          width={32}
          height={32}
          className="mt-[2px] shrink-0"
          style={{ imageRendering: "pixelated" }}
          draggable={false}
        />
        <p className="leading-[15px]">
          Type the name of a program, folder, document, or Internet resource, and Floppyy will open it for you.
        </p>
      </div>
      <div className="flex items-center gap-[8px]">
        <label htmlFor="run-open" className="shrink-0"><u>O</u>pen:</label>
        <div ref={comboRef} className="relative flex h-[22px] min-w-0 flex-1">
          <input
            id="run-open"
            className="win-bevel-inset h-full min-w-0 flex-1 bg-white px-[4px] text-[11px]"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="win-button flex h-full w-[16px] items-center justify-center px-0"
            aria-label="Open list"
            onClick={toggleMenu}
          >
            <span
              aria-hidden="true"
              style={{
                width: 0,
                height: 0,
                borderLeft: "3px solid transparent",
                borderRight: "3px solid transparent",
                borderTop: "4px solid #000",
              }}
            />
          </button>
          {histOpen && menuRect && typeof document !== "undefined" &&
            createPortal(
              <>
                <div className="fixed inset-0 z-[9998]" onMouseDown={() => setHistOpen(false)} />
                <ul
                  className="fixed z-[9999] max-h-[240px] overflow-auto bg-white py-[1px] text-[11px] text-black"
                  style={{ left: menuRect.left, top: menuRect.top, width: menuRect.width, border: "1px solid #0a0a0a" }}
                >
                  {history.length > 0 && (
                    <>
                      <li className="px-[5px] py-[1px] text-[10px] font-bold text-[#808080]">Recent</li>
                      {history.map((item) => (
                        <li
                          key={`h-${item}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pick(item);
                          }}
                          className="cursor-default truncate px-[5px] py-[1px] hover:bg-[#000080] hover:text-white"
                        >
                          {item}
                        </li>
                      ))}
                      <li className="my-[1px] border-t border-[#c0c0c0]" aria-hidden="true" />
                    </>
                  )}
                  <li className="px-[5px] py-[1px] text-[10px] font-bold text-[#808080]">Commands</li>
                  {RUN_SUGGESTIONS.map((item) => (
                    <li
                      key={`c-${item}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(item);
                      }}
                      className="cursor-default truncate px-[5px] py-[1px] hover:bg-[#000080] hover:text-white"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </>,
              document.body,
            )}
        </div>
      </div>
      <div className="mt-auto flex justify-end gap-[6px]">
        <button
          type="submit"
          className="win-button min-w-[75px] disabled:text-[#808080]"
          disabled={value.trim().length === 0}
          style={value.trim().length === 0 ? { textShadow: "1px 1px #ffffff" } : undefined}
        >
          OK
        </button>
        <button type="button" className="win-button min-w-[75px]" onClick={() => closeWindow(win.instanceId)}>
          Cancel
        </button>
        <button
          type="button"
          className="win-button min-w-[75px]"
          onClick={() => {
            playSound("click");
            notify("There's nothing to browse — just type a name and press OK.");
          }}
        >
          <u>B</u>rowse...
        </button>
      </div>
    </form>
  );
}
