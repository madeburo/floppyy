"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WindowComponentProps } from "@/lib/windows";
import { projects } from "@/lib/projects";

type Drive = "C" | "D";
type EntryKind = "file" | "dir";
type PanelSide = "left" | "right";

type FileEntry = {
  name: string;
  kind: EntryKind;
  size: number;
  date: string;
  content?: string;
};

type FileSystem = Record<Drive, Record<string, FileEntry[]>>;
type PanelState = { drive: Drive; path: string[]; cursor: number; selected: string[] };
type DialogState =
  | { type: "view"; title: string; text: string }
  | { type: "edit"; title: string; text: string; drive: Drive; path: string[]; name: string }
  | { type: "prompt"; title: string; label: string; value: string; action: "mkdir" | "rename" }
  | { type: "confirm"; title: string; text: string; action: "delete" }
  | null;

const pathKey = (path: string[]) => (path.length ? path.join("\\") : "\\");
const cloneEntry = (entry: FileEntry): FileEntry => ({ ...entry });
const today = () =>
  new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" }).replace(/\//g, "-");

const initialFs: FileSystem = {
  C: {
    "\\": [
      {
        name: "AUTOEXEC.BAT",
        kind: "file",
        size: 184,
        date: "06-26-98",
        content: "@ECHO OFF\nSET PATH=C:\\WINDOWS;C:\\WINDOWS\\COMMAND\nSET BLASTER=A220 I5 D1\nLH C:\\WINDOWS\\SMARTDRV.EXE\n",
      },
      {
        name: "COMMAND.COM",
        kind: "file",
        size: 93890,
        date: "06-26-98",
        content: "This program cannot be run in browser mode.\n\nBut it does enjoy being looked at.",
      },
      {
        name: "CONFIG.SYS",
        kind: "file",
        size: 128,
        date: "06-26-98",
        content: "DEVICE=C:\\WINDOWS\\HIMEM.SYS\nDEVICE=C:\\WINDOWS\\EMM386.EXE NOEMS\nDOS=HIGH,UMB\nFILES=40\nBUFFERS=20\n",
      },
      { name: "DOCS", kind: "dir", size: 0, date: "06-01-26" },
      { name: "DOOM", kind: "dir", size: 0, date: "05-31-26" },
      { name: "GAMES", kind: "dir", size: 0, date: "05-31-26" },
      { name: "WINAMP", kind: "dir", size: 0, date: "05-31-26" },
      {
        name: "README.TXT",
        kind: "file",
        size: 720,
        date: "06-01-26",
        content:
          "Welcome to Floppyy Commander.\n\nTab switches panels.\nEnter opens directories or views files.\nF3 View, F4 Edit, F5 Copy, F7 MkDir, F8 Delete.\nAll changes are temporary and live inside this window.\n",
      },
    ],
    DOCS: [
      {
        name: "AOL.URL",
        kind: "file",
        size: 96,
        date: "06-01-26",
        content: "[InternetShortcut]\nURL=https://www.aol.com\n",
      },
      {
        name: "CLOUDS.BMP",
        kind: "file",
        size: 45248,
        date: "06-01-26",
        content: "Bitmap preview is available in My Documents. Norton Commander shows metadata only.",
      },
      {
        name: "NOTES.TXT",
        kind: "file",
        size: 318,
        date: "06-01-26",
        content: "Things to remember:\n- The web you grew up on.\n- Not an emulator.\n- Mostly.",
      },
    ],
    DOOM: [
      { name: "DOOM.EXE", kind: "file", size: 715493, date: "12-10-93", content: "Knee-deep in browser nostalgia." },
      { name: "DOOM.WAD", kind: "file", size: 4096000, date: "12-10-93", content: "Binary data. Lots of it." },
    ],
    GAMES: [
      { name: "MINES.EXE", kind: "file", size: 40960, date: "06-01-26", content: "Minesweeper launcher." },
      { name: "SOL.EXE", kind: "file", size: 65536, date: "06-01-26", content: "Solitaire launcher." },
    ],
    WINAMP: [
      { name: "WINAMP.EXE", kind: "file", size: 524288, date: "06-01-26", content: "It really whips the llama." },
      { name: "PLAYLIST.M3U", kind: "file", size: 112, date: "06-01-26", content: "winamp-intro.mp3\nwinamp-alternative.mp3\n" },
    ],
  },
  D: {
    "\\": [
      {
        name: "ABOUT.TXT",
        kind: "file",
        size: 512,
        date: "06-01-26",
        content:
          "Floppyy is a retro computer in your browser.\n\nIt brings back the feeling of old desktop systems, pixel windows, floppy disks, BIOS boot screens, Winamp vibes, classic games, and the early web.",
      },
      { name: "CONTACT.CRD", kind: "file", size: 240, date: "06-01-26", content: "Floppyy\nwww.floppyy.com\nhi@floppyy.com\n" },
      { name: "FLOPPYY", kind: "dir", size: 0, date: "06-01-26" },
      { name: "PROJECTS", kind: "dir", size: 0, date: "06-01-26" },
      { name: "SETUP.EXE", kind: "file", size: 131072, date: "06-01-26", content: "Setup is already complete. Please enjoy the desktop." },
      { name: "SYSTEM", kind: "dir", size: 0, date: "06-01-26" },
      { name: "TEMP", kind: "dir", size: 0, date: "06-01-26" },
    ],
    FLOPPYY: [
      { name: "BRAND.TXT", kind: "file", size: 384, date: "06-01-26", content: "Name: Floppyy\nTagline: The web you grew up on.\nDomain: www.floppyy.com\n" },
      { name: "BOOT.LOG", kind: "file", size: 220, date: "06-01-26", content: "Energy Star OK\nBIOS OK\nNostalgia loaded\n" },
    ],
    PROJECTS: projects.map((project) => {
      const content = `${project.description}\n${project.site}\n`;
      return {
        name: `${project.slug.slice(0, 8).toUpperCase()}.TXT`,
        kind: "file",
        size: content.length,
        date: "10-06-26",
        content,
      };
    }),
    SYSTEM: [
      { name: "KERNEL32.DLL", kind: "file", size: 471040, date: "06-26-98", content: "System file. Please do not shake." },
      { name: "USER.EXE", kind: "file", size: 462336, date: "06-26-98", content: "User interface routines are feeling classic." },
    ],
    TEMP: [{ name: "SCRATCH.TMP", kind: "file", size: 0, date: "06-01-26", content: "" }],
  },
};

function formatSize(entry: FileEntry) {
  return entry.kind === "dir" ? "<DIR>" : entry.size.toLocaleString("en-US");
}

function withUniqueName(entries: FileEntry[], desiredName: string) {
  if (!entries.some((entry) => entry.name.toUpperCase() === desiredName.toUpperCase())) return desiredName;
  const dot = desiredName.lastIndexOf(".");
  const base = dot > 0 ? desiredName.slice(0, dot) : desiredName;
  const ext = dot > 0 ? desiredName.slice(dot) : "";
  let index = 1;
  let next = `${base}_${index}${ext}`;
  while (entries.some((entry) => entry.name.toUpperCase() === next.toUpperCase())) {
    index += 1;
    next = `${base}_${index}${ext}`;
  }
  return next;
}

function listEntries(fs: FileSystem, panel: PanelState) {
  return fs[panel.drive][pathKey(panel.path)] ?? [];
}

function getCurrentEntry(fs: FileSystem, panel: PanelState) {
  return listEntries(fs, panel)[panel.cursor] ?? null;
}

function updatePanelCursor(panel: PanelState, entriesLength: number, nextCursor: number): PanelState {
  return { ...panel, cursor: Math.max(0, Math.min(Math.max(0, entriesLength - 1), nextCursor)) };
}

function Panel({
  side,
  state,
  entries,
  active,
  onActivate,
  onCursor,
  onEnter,
  onParent,
}: {
  side: PanelSide;
  state: PanelState;
  entries: FileEntry[];
  active: boolean;
  onActivate: (side: PanelSide) => void;
  onCursor: (side: PanelSide, index: number) => void;
  onEnter: (side: PanelSide) => void;
  onParent: (side: PanelSide) => void;
}) {
  const rows = state.path.length
    ? [{ name: "..", kind: "dir" as const, size: 0, date: "" }, ...entries]
    : entries;
  const offset = state.path.length ? 1 : 0;
  const currentVisualIndex = state.cursor + offset;

  return (
    <section className="flex min-w-0 flex-1 flex-col border border-[#55ffff] bg-[#0000aa] text-white" onMouseDown={() => onActivate(side)}>
      <div className="flex h-[20px] items-center justify-between bg-[#00aaaa] px-2 text-black">
        <span>{state.drive}:{state.path.length ? `\\${state.path.join("\\")}` : "\\"}</span>
        <span>{active ? "Name" : "Info"}</span>
      </div>
      <div className="grid flex-1 auto-rows-[20px] grid-cols-[18px_minmax(0,1fr)_74px_72px] overflow-hidden p-1 font-mono text-[12px] leading-[18px]">
        {rows.map((entry, visualIndex) => {
          const realIndex = visualIndex - offset;
          const isParent = entry.name === "..";
          const isActive = active && visualIndex === currentVisualIndex;
          const selected = !isParent && state.selected.includes(entry.name);
          return (
            <button
              key={`${entry.name}-${visualIndex}`}
              type="button"
              className="contents text-left text-white"
              onClick={() => {
                onActivate(side);
                if (!isParent) onCursor(side, Math.max(0, realIndex));
              }}
              onDoubleClick={() => {
                if (isParent) onParent(side);
                else onEnter(side);
              }}
            >
              <span className={`px-1 ${selected ? "text-[#ffff55]" : "text-white"}`}>{selected ? "√" : entry.kind === "dir" ? "■" : " "}</span>
              <span className={`truncate px-1 ${isActive ? "bg-[#00aaaa] text-black" : selected ? "text-[#ffff55]" : "text-white"}`}>
                {entry.name}
              </span>
              <span className={`px-1 text-right ${isActive ? "bg-[#00aaaa] text-black" : "text-white"}`}>{isParent ? "" : formatSize(entry)}</span>
              <span className={`px-1 text-right ${isActive ? "bg-[#00aaaa] text-black" : "text-white"}`}>{entry.date}</span>
            </button>
          );
        })}
      </div>
      <div className="h-[20px] bg-[#00aaaa] px-2 text-black">
        {state.selected.length ? `${state.selected.length} selected` : `${entries.length} item(s)`}
      </div>
    </section>
  );
}

export function NortonCommanderWindow({ window: win, closeWindow, openWindow, notify, playSound }: WindowComponentProps) {
  const [fs, setFs] = useState<FileSystem>(initialFs);
  const [active, setActive] = useState<PanelSide>("left");
  const [left, setLeft] = useState<PanelState>({ drive: "C", path: [], cursor: 0, selected: [] });
  const [right, setRight] = useState<PanelState>({ drive: "D", path: [], cursor: 0, selected: [] });
  const [dialog, setDialog] = useState<DialogState>(null);
  const [commandText, setCommandText] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const leftEntries = useMemo(() => listEntries(fs, left), [fs, left]);
  const rightEntries = useMemo(() => listEntries(fs, right), [fs, right]);
  const activePanel = active === "left" ? left : right;
  const passivePanel = active === "left" ? right : left;
  const activeEntries = active === "left" ? leftEntries : rightEntries;
  const setActivePanel = active === "left" ? setLeft : setRight;

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  const setPanelCursor = useCallback(
    (side: PanelSide, index: number) => {
      const setter = side === "left" ? setLeft : setRight;
      const entries = side === "left" ? leftEntries : rightEntries;
      setter((panel) => updatePanelCursor(panel, entries.length, index));
    },
    [leftEntries, rightEntries],
  );

  const executeFile = useCallback(
    (entry: FileEntry) => {
      const name = entry.name.toUpperCase();
      if (name === "WINAMP.EXE") {
        openWindow("music");
        return true;
      }
      if (name === "DOOM.EXE") {
        openWindow("doom");
        return true;
      }
      if (name === "MINES.EXE") {
        openWindow("minesweeper");
        return true;
      }
      if (name === "SOL.EXE") {
        openWindow("games", "solitaire");
        return true;
      }
      if (name === "SETUP.EXE") {
        notify("Setup is already complete.");
        return true;
      }
      if (name.endsWith(".URL")) {
        const url = entry.content?.match(/URL=(.+)/i)?.[1]?.trim();
        openWindow("ie-browser", url || "https://www.aol.com");
        return true;
      }
      return false;
    },
    [openWindow, notify],
  );

  const enterPanel = useCallback(
    (side: PanelSide = active) => {
      const panel = side === "left" ? left : right;
      const entries = side === "left" ? leftEntries : rightEntries;
      if (panel.path.length && panel.cursor === 0 && entries[0]?.name !== "..") {
        return;
      }
      const entry = entries[panel.cursor];
      if (!entry) return;
      playSound("click");
      if (entry.kind === "dir") {
        const setter = side === "left" ? setLeft : setRight;
        setter((value) => ({ ...value, path: [...value.path, entry.name], cursor: 0, selected: [] }));
      } else if (executeFile(entry)) {
        notify(`Executing ${entry.name}...`);
      } else {
        setDialog({ type: "view", title: `${entry.name} - Viewer`, text: entry.content || `${entry.name}\n\nNo preview available.` });
      }
    },
    [active, left, right, leftEntries, rightEntries, playSound, executeFile, notify],
  );

  const goUp = useCallback((side: PanelSide = active) => {
    playSound("click");
    const setter = side === "left" ? setLeft : setRight;
    setter((panel) =>
      panel.path.length ? { ...panel, path: panel.path.slice(0, -1), cursor: 0, selected: [] } : panel,
    );
  }, [active, playSound]);

  const toggleSelected = useCallback(
    (side: PanelSide, name?: string) => {
      const entries = side === "left" ? leftEntries : rightEntries;
      const setter = side === "left" ? setLeft : setRight;
      const panel = side === "left" ? left : right;
      const entryName = name ?? entries[panel.cursor]?.name;
      if (!entryName) return;
      setter((value) => ({
        ...value,
        selected: value.selected.includes(entryName)
          ? value.selected.filter((item) => item !== entryName)
          : [...value.selected, entryName],
      }));
      playSound("click");
    },
    [left, right, leftEntries, rightEntries, playSound],
  );

  const chosenEntries = useCallback(
    (panel: PanelState, entries: FileEntry[]) => {
      const names = panel.selected.length ? panel.selected : entries[panel.cursor] ? [entries[panel.cursor].name] : [];
      return entries.filter((entry) => names.includes(entry.name));
    },
    [],
  );

  const copySelected = useCallback(() => {
    const fromEntries = chosenEntries(activePanel, activeEntries);
    if (!fromEntries.length) return;
    const targetPath = pathKey(passivePanel.path);
    setFs((current) => {
      const targetEntries = current[passivePanel.drive][targetPath] ?? [];
      const copies = fromEntries.map((entry) => ({ ...cloneEntry(entry), name: withUniqueName(targetEntries, entry.name), date: today() }));
      return {
        ...current,
        [passivePanel.drive]: {
          ...current[passivePanel.drive],
          [targetPath]: [...targetEntries, ...copies],
        },
      };
    });
    setActivePanel((panel) => ({ ...panel, selected: [] }));
    notify(`${fromEntries.length} item(s) copied to ${passivePanel.drive}:${passivePanel.path.length ? `\\${passivePanel.path.join("\\")}` : "\\"}`);
    playSound("click");
  }, [activePanel, activeEntries, passivePanel, chosenEntries, notify, playSound, setActivePanel]);

  const deleteSelected = useCallback(() => {
    const entries = chosenEntries(activePanel, activeEntries);
    if (!entries.length) return;
    setDialog({ type: "confirm", title: "Delete", text: `Delete ${entries.length} item(s) from ${activePanel.drive}:?`, action: "delete" });
    playSound("click");
  }, [activePanel, activeEntries, chosenEntries, playSound]);

  const confirmDelete = useCallback(() => {
    const names = chosenEntries(activePanel, activeEntries).map((entry) => entry.name);
    if (!names.length) return;
    const key = pathKey(activePanel.path);
    setFs((current) => ({
      ...current,
      [activePanel.drive]: {
        ...current[activePanel.drive],
        [key]: (current[activePanel.drive][key] ?? []).filter((entry) => !names.includes(entry.name)),
      },
    }));
    setActivePanel((panel) => ({ ...panel, cursor: 0, selected: [] }));
    setDialog(null);
    notify(`${names.length} item(s) deleted.`);
    playSound("click");
  }, [activePanel, activeEntries, chosenEntries, notify, playSound, setActivePanel]);

  const viewFile = useCallback(() => {
    const entry = getCurrentEntry(fs, activePanel);
    if (!entry) return;
    if (entry.kind === "dir") {
      enterPanel(active);
      return;
    }
    setDialog({ type: "view", title: `${entry.name} - Viewer`, text: entry.content || `${entry.name}\n\nNo preview available.` });
    playSound("click");
  }, [fs, activePanel, active, enterPanel, playSound]);

  const editFile = useCallback(() => {
    const entry = getCurrentEntry(fs, activePanel);
    if (!entry) return;
    if (entry.kind === "dir") {
      notify("Cannot edit directory.");
      playSound("error");
      return;
    }
    setDialog({
      type: "edit",
      title: `${entry.name} - Editor`,
      text: entry.content || "",
      drive: activePanel.drive,
      path: activePanel.path,
      name: entry.name,
    });
    playSound("click");
  }, [fs, activePanel, notify, playSound]);

  const saveEditor = useCallback(() => {
    if (!dialog || dialog.type !== "edit") return;
    const key = pathKey(dialog.path);
    setFs((current) => ({
      ...current,
      [dialog.drive]: {
        ...current[dialog.drive],
        [key]: (current[dialog.drive][key] ?? []).map((entry) =>
          entry.name === dialog.name ? { ...entry, content: dialog.text, size: dialog.text.length, date: today() } : entry,
        ),
      },
    }));
    setDialog(null);
    notify(`${dialog.name} saved.`);
    playSound("click");
  }, [dialog, notify, playSound]);

  const runPromptAction = useCallback(() => {
    if (!dialog || dialog.type !== "prompt") return;
    const rawName = dialog.value.trim().toUpperCase();
    if (!rawName) return;
    const key = pathKey(activePanel.path);
    if (dialog.action === "mkdir") {
      setFs((current) => {
        const existing = current[activePanel.drive][key] ?? [];
        const name = withUniqueName(existing, rawName);
        return {
          ...current,
          [activePanel.drive]: {
            ...current[activePanel.drive],
            [key]: [...existing, { name, kind: "dir", size: 0, date: today() }],
            [pathKey([...activePanel.path, name])]: [],
          },
        };
      });
      notify(`Directory ${rawName} created.`);
    } else {
      const entry = getCurrentEntry(fs, activePanel);
      if (!entry) return;
      setFs((current) => {
        const existing = current[activePanel.drive][key] ?? [];
        const name = withUniqueName(existing.filter((item) => item.name !== entry.name), rawName);
        const nextDrive = {
          ...current[activePanel.drive],
          [key]: existing.map((item) => (item.name === entry.name ? { ...item, name, date: today() } : item)),
        };
        if (entry.kind === "dir") {
          const oldDirKey = pathKey([...activePanel.path, entry.name]);
          const newDirKey = pathKey([...activePanel.path, name]);
          nextDrive[newDirKey] = current[activePanel.drive][oldDirKey] ?? [];
          delete nextDrive[oldDirKey];
        }
        return { ...current, [activePanel.drive]: nextDrive };
      });
      notify(`${entry.name} renamed.`);
    }
    setDialog(null);
    playSound("click");
  }, [dialog, activePanel, fs, notify, playSound]);

  const runAction = useCallback(
    (action: string) => {
      switch (action) {
        case "view":
          viewFile();
          break;
        case "edit":
          editFile();
          break;
        case "copy":
          copySelected();
          break;
        case "renmov": {
          const entry = getCurrentEntry(fs, activePanel);
          if (entry) setDialog({ type: "prompt", title: "Rename", label: "New name:", value: entry.name, action: "rename" });
          break;
        }
        case "mkdir":
          setDialog({ type: "prompt", title: "Make Directory", label: "Directory name:", value: "NEWFOLDER", action: "mkdir" });
          break;
        case "delete":
          deleteSelected();
          break;
        case "quit":
          closeWindow(win.instanceId);
          break;
      }
    },
    [activePanel, fs, viewFile, editFile, copySelected, deleteSelected, closeWindow, win.instanceId],
  );

  const runCommandLine = useCallback(() => {
    const command = commandText.trim().toLowerCase();
    if (!command) return;
    if (command === "llama") {
      openWindow("music");
      notify("Norton Commander found a llama. Launching Winamp...");
      playSound("open");
      setCommandText("");
      return;
    }
    notify(`Bad command or file name - ${commandText}`);
    playSound("error");
    setCommandText("");
  }, [commandText, notify, openWindow, playSound]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (dialog) {
        if (event.key === "Escape") setDialog(null);
        return;
      }
      const entriesLength = activeEntries.length;
      switch (event.key) {
        case "Tab":
          event.preventDefault();
          setActive((value) => (value === "left" ? "right" : "left"));
          playSound("click");
          break;
        case "ArrowDown":
          event.preventDefault();
          setActivePanel((panel) => updatePanelCursor(panel, entriesLength, panel.cursor + 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          setActivePanel((panel) => updatePanelCursor(panel, entriesLength, panel.cursor - 1));
          break;
        case "PageDown":
          event.preventDefault();
          setActivePanel((panel) => updatePanelCursor(panel, entriesLength, panel.cursor + 10));
          break;
        case "PageUp":
          event.preventDefault();
          setActivePanel((panel) => updatePanelCursor(panel, entriesLength, panel.cursor - 10));
          break;
        case "Enter":
          event.preventDefault();
          enterPanel(active);
          break;
        case "Backspace":
          event.preventDefault();
          goUp(active);
          break;
        case "Insert":
          event.preventDefault();
          toggleSelected(active);
          setActivePanel((panel) => updatePanelCursor(panel, entriesLength, panel.cursor + 1));
          break;
        case "F3":
          event.preventDefault();
          runAction("view");
          break;
        case "F4":
          event.preventDefault();
          runAction("edit");
          break;
        case "F5":
          event.preventDefault();
          runAction("copy");
          break;
        case "F6":
          event.preventDefault();
          runAction("renmov");
          break;
        case "F7":
          event.preventDefault();
          runAction("mkdir");
          break;
        case "F8":
          event.preventDefault();
          runAction("delete");
          break;
        case "F10":
          event.preventDefault();
          runAction("quit");
          break;
      }
    },
    [dialog, activeEntries.length, active, setActivePanel, playSound, enterPanel, goUp, toggleSelected, runAction],
  );

  const buttons = [
    ["F3 View", "view"],
    ["F4 Edit", "edit"],
    ["F5 Copy", "copy"],
    ["F6 RenMov", "renmov"],
    ["F7 MkDir", "mkdir"],
    ["F8 Delete", "delete"],
    ["F10 Quit", "quit"],
  ];

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      className="relative flex h-full flex-col bg-[#0000aa] p-1 font-mono text-[12px] text-white outline-none"
      onKeyDown={onKeyDown}
      onMouseDown={() => rootRef.current?.focus()}
    >
      <div className="mb-1 flex h-[22px] items-center gap-5 bg-[#00aaaa] px-2 text-black">
        <span>Left</span>
        <span>Files</span>
        <span>Commands</span>
        <span>Options</span>
        <span>Right</span>
        <span className="ml-auto">Tab switches panels</span>
      </div>
      <div className="flex min-h-0 flex-1 gap-1">
        <Panel
          side="left"
          state={left}
          entries={leftEntries}
          active={active === "left"}
          onActivate={setActive}
          onCursor={setPanelCursor}
          onEnter={enterPanel}
          onParent={goUp}
        />
        <Panel
          side="right"
          state={right}
          entries={rightEntries}
          active={active === "right"}
          onActivate={setActive}
          onCursor={setPanelCursor}
          onEnter={enterPanel}
          onParent={goUp}
        />
      </div>
      <div className="mt-1 flex h-[22px] items-center bg-black px-2 text-[#c0c0c0]">
        <span>{activePanel.drive}:\&gt;</span>
        <input
          className="ml-1 flex-1 bg-transparent text-white outline-none"
          value={commandText}
          onChange={(event) => setCommandText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              runCommandLine();
            }
          }}
          aria-label="Norton command line"
        />
      </div>
      <div className="mt-1 flex gap-[2px] text-[11px]">
        {buttons.map(([label, action]) => (
          <button
            key={action}
            className="h-[24px] flex-1 bg-[#00aaaa] px-1 text-left text-black active:bg-[#ffff55]"
            onClick={() => runAction(action)}
          >
            {label}
          </button>
        ))}
      </div>

      {dialog && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 p-6">
          <div className="w-[min(520px,90%)] border border-[#55ffff] bg-[#0000aa] text-white shadow-[6px_6px_0_#000]">
            <div className="flex h-[22px] items-center justify-between bg-[#00aaaa] px-2 text-black">
              <span>{dialog.title}</span>
              <button className="px-2" onClick={() => setDialog(null)}>
                X
              </button>
            </div>
            {dialog.type === "view" && (
              <div className="p-2">
                <pre className="h-[220px] overflow-auto border border-[#55ffff] bg-black p-2 text-[#c0c0c0] whitespace-pre-wrap">
                  {dialog.text}
                </pre>
                <div className="mt-2 text-right">
                  <button className="bg-[#00aaaa] px-6 py-1 text-black" onClick={() => setDialog(null)}>
                    OK
                  </button>
                </div>
              </div>
            )}
            {dialog.type === "edit" && (
              <div className="p-2">
                <textarea
                  className="h-[220px] w-full resize-none border border-[#55ffff] bg-black p-2 text-[#c0c0c0] outline-none"
                  value={dialog.text}
                  onChange={(event) => setDialog({ ...dialog, text: event.target.value })}
                  spellCheck={false}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button className="bg-[#00aaaa] px-5 py-1 text-black" onClick={saveEditor}>
                    Save
                  </button>
                  <button className="bg-[#00aaaa] px-5 py-1 text-black" onClick={() => setDialog(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {dialog.type === "prompt" && (
              <div className="p-4">
                <label className="mb-2 block">{dialog.label}</label>
                <input
                  className="w-full border border-[#55ffff] bg-black px-2 py-1 text-white outline-none"
                  value={dialog.value}
                  onChange={(event) => setDialog({ ...dialog, value: event.target.value })}
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button className="bg-[#00aaaa] px-5 py-1 text-black" onClick={runPromptAction}>
                    OK
                  </button>
                  <button className="bg-[#00aaaa] px-5 py-1 text-black" onClick={() => setDialog(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {dialog.type === "confirm" && (
              <div className="p-4">
                <p>{dialog.text}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button className="bg-[#00aaaa] px-5 py-1 text-black" onClick={confirmDelete}>
                    Delete
                  </button>
                  <button className="bg-[#00aaaa] px-5 py-1 text-black" onClick={() => setDialog(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
