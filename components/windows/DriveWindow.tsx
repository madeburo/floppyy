"use client";

import { useMemo, useState } from "react";
import type { WindowComponentProps } from "@/lib/windows";
import { ToolbarIcon } from "./ToolbarIcon";
import { GAME_REGISTRY } from "@/lib/gameRegistry";
import { projects } from "@/lib/projects";

type DriveId = "A" | "C" | "D";
type DriveItem = {
  id: string;
  label: string;
  icon: string;
  description: string;
  kind: "folder" | "file";
  target?: string;
  content?: string;
};

const toolbarButtons = [
  { label: "Back", icon: "back", action: "back" },
  { label: "Forward", icon: "forward", action: "noop" },
  { label: "Up", icon: "up", action: "up" },
  { label: "Cut", icon: "cut", action: "noop" },
  { label: "Copy", icon: "copy", action: "noop" },
  { label: "Paste", icon: "paste", action: "noop" },
  { label: "Undo", icon: "undo", action: "noop" },
  { label: "Delete", icon: "delete", action: "noop" },
  { label: "Properties", icon: "properties", action: "properties" },
  { label: "Views", icon: "views", action: "views" },
];

const driveFiles: Record<DriveId, Record<string, DriveItem[]>> = {
  A: {
    "": [
      { id: "floppyy-exe", label: "FLOPPYY.EXE", icon: "floppy", description: "Floppyy boot application", kind: "file" },
      {
        id: "readme",
        label: "README.TXT",
        icon: "notepad",
        description: "Text Document",
        kind: "file",
        content:
          "FLOPPYY BOOT DISK\n\nThis floppy starts Floppyy from a tiny corner of the old web.\n\nIf the desktop is already running, FLOPPYY.EXE will not start a second copy. That is normal. Click around, open a few windows, and remember everything minus the dial-up wait.\n\nMostly.",
      },
      {
        id: "bootlog",
        label: "BOOTLOG.TXT",
        icon: "notepad",
        description: "Boot log text file",
        kind: "file",
        content:
          "[BOOTLOG]\nBIOS initialized\nMemory test passed: 65536K\nPrimary Master: WDC AC21600H\nSecondary Master: ATAPI CD-ROM\nFloppy Drive A: 1.44M, 3.5 in.\nBooting from A:\\\nLoading A:\\FLOPPYY\\FLOPPYY.EXE\nStarting Floppyy shell\nDesktop initialized\nStatus: OK",
      },
      {
        id: "oldweb",
        label: "OLDWEB.INI",
        icon: "gears",
        description: "Configuration Settings",
        kind: "file",
        content:
          "[OldWeb]\nHomePage=https://www.floppyy.com\nDialUpSpeed=33.6kbps\nBookmarks=AOL,Yahoo,GeoCities,SpaceJam\nRememberEverything=1\nWaitForDialup=0",
      },
    ],
  },
  C: {
    "": [
      { id: "windows", label: "WINDOWS", icon: "folder", description: "System folder", kind: "folder", target: "WINDOWS" },
      { id: "program-files", label: "Program Files", icon: "folder", description: "Installed programs", kind: "folder", target: "Program Files" },
      { id: "my-documents", label: "My Documents", icon: "documents", description: "Personal documents", kind: "folder", target: "My Documents" },
      { id: "projects", label: "Projects", icon: "directory_net", description: "Project files and shortcuts", kind: "folder", target: "Projects" },
      { id: "games", label: "Games", icon: "directory_open", description: "Classic games", kind: "folder", target: "Games" },
      { id: "autoexec", label: "AUTOEXEC.BAT", icon: "notepad", description: "MS-DOS Batch File", kind: "file" },
      { id: "config", label: "CONFIG.SYS", icon: "notepad", description: "System File", kind: "file" },
      { id: "command", label: "COMMAND.COM", icon: "prompt", description: "MS-DOS Application", kind: "file" },
    ],
    WINDOWS: [
      { id: "desktop", label: "Desktop", icon: "folder", description: "Desktop folder", kind: "folder", target: "WINDOWS\\Desktop" },
      { id: "system", label: "System", icon: "folder", description: "Windows system files", kind: "folder", target: "WINDOWS\\System" },
      { id: "clouds", label: "Clouds.bmp", icon: "painticon", description: "Bitmap Image", kind: "file" },
      { id: "winini", label: "WIN.INI", icon: "notepad", description: "Configuration Settings", kind: "file" },
    ],
    "WINDOWS\\Desktop": [
      { id: "internet", label: "Internet Explorer.lnk", icon: "ie", description: "Shortcut", kind: "file" },
      { id: "outlook", label: "Outlook Express.lnk", icon: "msoutlook", description: "Shortcut", kind: "file" },
      { id: "norton", label: "Norton Commander.lnk", icon: "console", description: "Shortcut", kind: "file" },
    ],
    "WINDOWS\\System": [
      { id: "kernel", label: "KERNEL32.DLL", icon: "gears", description: "Application Extension", kind: "file" },
      { id: "user", label: "USER.EXE", icon: "computer", description: "Application", kind: "file" },
      { id: "mmsystem", label: "MMSYSTEM.DLL", icon: "speaker", description: "Audio system file", kind: "file" },
    ],
    "Program Files": [
      { id: "winamp", label: "Winamp", icon: "winamp", description: "Media player folder", kind: "folder", target: "Program Files\\Winamp" },
      { id: "mcafee", label: "McAfee", icon: "McAfee", description: "Antivirus folder", kind: "folder", target: "Program Files\\McAfee" },
      { id: "netscape", label: "Netscape", icon: "netscape", description: "Browser folder", kind: "folder", target: "Program Files\\Netscape" },
    ],
    "Program Files\\Winamp": [
      { id: "winamp-exe", label: "WINAMP.EXE", icon: "winamp", description: "Application", kind: "file" },
      { id: "playlist", label: "PLAYLIST.M3U", icon: "notepad", description: "M3U Playlist", kind: "file" },
    ],
    "Program Files\\McAfee": [
      { id: "scan", label: "VSCAN.EXE", icon: "McAfee", description: "Application", kind: "file" },
      { id: "dat", label: "CLEAN.DAT", icon: "notepad", description: "Virus definitions", kind: "file" },
    ],
    "Program Files\\Netscape": [
      { id: "netscape-exe", label: "NETSCAPE.EXE", icon: "netscape", description: "Application", kind: "file" },
      { id: "bookmark", label: "BOOKMARK.HTM", icon: "html", description: "HTML Document", kind: "file" },
    ],
    "My Documents": [
      { id: "clouds-doc", label: "Clouds.bmp", icon: "painticon", description: "Bitmap Image", kind: "file" },
      { id: "aol", label: "AOL.url", icon: "url", description: "Internet Shortcut", kind: "file" },
      { id: "readme", label: "README.txt", icon: "notepad", description: "Text Document", kind: "file" },
    ],
    Projects: projects.map((project) => ({
      id: project.slug,
      label: project.name,
      icon: "folder",
      description: project.description,
      kind: "file",
    })),
    Games: GAME_REGISTRY.map((game) => ({ ...game, kind: "file" })),
  },
  D: {
    "": [
      { id: "floppyy-cd", label: "Floppyy 98", icon: "folder", description: "Floppyy installation files", kind: "folder", target: "Floppyy 98" },
      { id: "drivers", label: "Drivers", icon: "folder", description: "Device drivers", kind: "folder", target: "Drivers" },
      { id: "extras", label: "Extras", icon: "folder", description: "Bonus programs", kind: "folder", target: "Extras" },
      { id: "setup", label: "SETUP.EXE", icon: "gears", description: "Application", kind: "file" },
      { id: "readme", label: "README.TXT", icon: "notepad", description: "Text Document", kind: "file" },
    ],
    "Floppyy 98": [
      { id: "about", label: "ABOUT.TXT", icon: "notepad", description: "Text Document", kind: "file" },
      { id: "brand", label: "BRAND.TXT", icon: "notepad", description: "Text Document", kind: "file" },
      { id: "start", label: "START.HTM", icon: "html", description: "HTML Document", kind: "file" },
    ],
    Drivers: [
      { id: "modem", label: "MODEM.INF", icon: "notepad", description: "Setup Information", kind: "file" },
      { id: "display", label: "DISPLAY.INF", icon: "notepad", description: "Setup Information", kind: "file" },
      { id: "sound", label: "SOUND.INF", icon: "speaker", description: "Setup Information", kind: "file" },
    ],
    Extras: [
      { id: "winamp", label: "WINAMP.EXE", icon: "winamp", description: "Application", kind: "file" },
      { id: "norton", label: "NC.EXE", icon: "console", description: "Application", kind: "file" },
      { id: "shareware", label: "SHAREWARE.TXT", icon: "notepad", description: "Text Document", kind: "file" },
    ],
  },
};

function driveTitle(drive: DriveId) {
  if (drive === "A") return "3½ Floppy (A:)";
  return drive === "C" ? "(C:)" : "(D:)";
}

function driveDescription(drive: DriveId) {
  if (drive === "A") return "3½ Inch Floppy Disk";
  return drive === "C" ? "Local Disk" : "Compact Disc";
}

function parentPath(path: string) {
  const parts = path.split("\\").filter(Boolean);
  parts.pop();
  return parts.join("\\");
}

function itemType(item: DriveItem) {
  if (item.kind === "folder") return "File Folder";
  const label = item.label.toLowerCase();
  if (label.endsWith(".exe") || label.endsWith(".com")) return "Application";
  if (label.endsWith(".dll")) return "Application Extension";
  if (label.endsWith(".bmp")) return "Bitmap Image";
  if (label.endsWith(".url")) return "Internet Shortcut";
  if (label.endsWith(".htm") || label.endsWith(".html")) return "HTML Document";
  if (label.endsWith(".ini") || label.endsWith(".inf")) return "Setup Information";
  if (label.endsWith(".bat")) return "MS-DOS Batch File";
  if (label.endsWith(".sys")) return "System File";
  return "Text Document";
}

function itemSize(item: DriveItem) {
  if (item.kind === "folder") return "";
  const sizes: Record<string, string> = {
    "COMMAND.COM": "94 KB",
    "SETUP.EXE": "128 KB",
    "FLOPPYY.EXE": "144 KB",
    "README.TXT": "2 KB",
    "BOOTLOG.TXT": "4 KB",
    "OLDWEB.INI": "1 KB",
    "WINAMP.EXE": "512 KB",
    "DOOM.EXE": "699 KB",
    "KERNEL32.DLL": "460 KB",
    "USER.EXE": "452 KB",
    "Clouds.bmp": "44 KB",
  };
  return sizes[item.label] ?? `${Math.max(1, item.label.length * 3)} KB`;
}

function itemModified(item: DriveItem) {
  if (item.label.includes("WINDOWS") || item.label.includes(".DLL") || item.label.includes(".SYS") || item.label.includes(".COM")) return "06/26/1998 12:00 AM";
  return "06/01/2026 01:35 PM";
}

export function DriveWindow({ window, notify, openWindow, playSound }: WindowComponentProps) {
  const drive: DriveId = window.payload === "A" ? "A" : window.payload === "D" ? "D" : "C";
  const [path, setPath] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"icons" | "details">("icons");
  const [viewer, setViewer] = useState<DriveItem | null>(null);

  const items = useMemo(() => driveFiles[drive][path] ?? [], [drive, path]);
  const selectedItem = items.find((item) => item.id === selected);
  const icon = drive === "A" ? "floppy" : drive === "D" ? "drive-d" : "drive-c";
  const address = `${drive}:\\${path}`;

  const goToPath = (nextPath: string) => {
    setHistory((items) => [...items, path]);
    setPath(nextPath);
    setSelected(null);
    playSound("open");
  };

  const goBack = () => {
    const previous = history.at(-1);
    if (previous === undefined) {
      notify("Back is not available.");
      playSound("error");
      return;
    }
    setHistory((items) => items.slice(0, -1));
    setPath(previous);
    setSelected(null);
    playSound("click");
  };

  const goUp = () => {
    if (!path) {
      openWindow("computer");
      return;
    }
    setPath(parentPath(path));
    setSelected(null);
    playSound("click");
  };

  const openItem = (item: DriveItem) => {
    if (drive === "C" && path === "Games") {
      const game = GAME_REGISTRY.find((game) => game.id === item.id);
      if (game) { openWindow(game.id); playSound("open"); return; }
    }
    if (drive === "C" && (path === "" || path === "My Documents") && item.id === "projects") {
      playSound("open");
      openWindow("projects");
      return;
    }

    if (item.kind === "folder" && item.target) {
      goToPath(item.target);
      return;
    }

    playSound("open");
    if (path === "Projects") {
      openWindow("project-details", item.id);
      return;
    }

    const label = item.label.toLowerCase();
    if (drive === "A" && label === "floppyy.exe") {
      notify("Floppyy is already running.");
      return;
    }
    if (item.content) {
      setViewer(item);
      return;
    }
    if (label.includes("winamp")) openWindow("music");
    else if (label.includes("snake")) openWindow("snake");
    else if (label.includes("tetris")) openWindow("tetris");
    else if (label.includes("breakout")) openWindow("breakout");
    else if (label.includes("pixelpuzzle")) openWindow("pixel-puzzle");
    else if (label.includes("typing")) openWindow("typing-game");
    else if (label.includes("checkers")) openWindow("checkers");
    else if (label.includes("minesweeper")) openWindow("minesweeper");
    else if (label.includes("solitaire")) openWindow("solitaire");
    else if (label.includes("doom")) openWindow("doom");
    else if (label.includes("duke")) openWindow("duke3d");
    else if (label.includes("wolf")) openWindow("wolf3d");
    else if (label.includes("dune")) openWindow("dune2");
    else if (label.includes("war.exe") || label.includes("warcraft")) openWindow("warcraft");
    else if (label.includes("netscape")) openWindow("netscape");
    else if (label.includes("internet explorer") || label.endsWith(".url") || label.endsWith(".htm")) openWindow("ie-browser", "https://www.aol.com/");
    else if (label.includes("norton") || label === "nc.exe") openWindow("norton");
    else if (label.endsWith(".bmp")) openWindow("paint", label === "clouds.bmp" ? "clouds" : undefined);
    else if (label.endsWith(".txt") || label.endsWith(".sys") || label.endsWith(".bat") || label.endsWith(".ini") || label.endsWith(".inf")) {
      openWindow("notepad", path === "My Documents" && label === "readme.txt" ? "readme" : undefined);
    }
  };

  const runToolbar = (action: string, label: string) => {
    if (action === "back") {
      goBack();
      return;
    }
    if (action === "up") {
      goUp();
      return;
    }
    if (action === "properties" && selectedItem) {
      notify(`${selectedItem.label}: ${selectedItem.description}`);
      playSound("click");
      return;
    }
    if (action === "views") {
      setViewMode((value) => (value === "icons" ? "details" : "icons"));
      playSound("click");
      return;
    }
    playSound("click");
    notify(`${label} is not available.`);
  };

  return (
    <div className="relative flex h-full flex-col bg-[#c0c0c0] text-[11px]">
      <div className="flex h-[20px] items-center border-b border-[#808080] bg-[#c0c0c0] px-1">
        {["File", "Edit", "View", "Go", "Favorites", "Help"].map((item) => (
          <span key={item} className="cursor-default px-2 hover:underline">
            {item}
          </span>
        ))}
      </div>

      <div className="flex h-[50px] items-center gap-0 border-b border-[#808080] bg-[#c0c0c0] px-1">
        {toolbarButtons.map((button) => (
          <button
            key={button.label}
            disabled={button.action === "noop" || (button.action === "back" && !history.length) || (button.action === "properties" && !selectedItem)}
            className="group flex h-[44px] w-[50px] cursor-default flex-col items-center justify-center text-[10px] hover:bg-[#dfdfdf]"
            onClick={() => runToolbar(button.action, button.label)}
          >
            <span className="flex h-[20px] items-center justify-center grayscale transition-[filter] duration-150 group-hover:grayscale-0"><ToolbarIcon name={button.icon} /></span>
            <span className="mt-[2px]">{button.label}</span>
          </button>
        ))}
      </div>

      <div className="flex h-[24px] items-center gap-1 border-b border-[#808080] bg-[#c0c0c0] px-2">
        <span className="mr-1 text-[11px] font-bold">Address</span>
        <div className="flex h-[18px] flex-1 items-center border border-[#808080] bg-white px-1">
          <img src={`/icons/${icon}.png`} alt="" width={16} height={16} draggable={false} style={{ imageRendering: "pixelated" }} />
          <span className="ml-1 text-[11px]">{address}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 border-t border-[#dfdfdf] bg-white">
        <aside
          className="relative flex w-[140px] shrink-0 flex-col overflow-hidden border-r border-[#c0c0c0] bg-white p-3"
          style={{
            background:
              "radial-gradient(circle at 8% 20%, rgba(255,255,255,0.95) 0 18%, rgba(255,255,255,0) 34%), linear-gradient(135deg, #d9f5ff 0%, #ffffff 52%, #ffffff 100%)",
          }}
        >
          <img src={`/icons/${icon}.png`} alt="" width={32} height={32} draggable={false} style={{ imageRendering: "pixelated" }} />
          <h2 className="mt-2 text-[16px] font-bold leading-tight">{driveTitle(drive)}</h2>
          <div className="mt-2 h-[2px] w-full bg-gradient-to-r from-[#ff0000] via-[#ffff00] via-[#00c853] to-[#0000ff]" />
          <p className="mt-3 text-[11px] leading-[13px]">
            {selectedItem ? selectedItem.description : `${driveDescription(drive)}. Select an item to view its description.`}
          </p>
        </aside>

        <div className="flex-1 overflow-auto p-4">
          {viewMode === "icons" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(82px,1fr))] content-start gap-x-2 gap-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  className="flex cursor-default flex-col items-center justify-start gap-1 rounded-none p-1 text-center"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelected(item.id);
                    playSound("click");
                  }}
                  onDoubleClick={() => openItem(item)}
                >
                  <span
                    className="flex items-center justify-center p-[2px]"
                    style={selected === item.id ? { background: "rgba(0,0,128,0.4)" } : undefined}
                  >
                    <img src={`/icons/${item.icon}.png`} alt="" width={32} height={32} draggable={false} style={{ imageRendering: "pixelated" }} />
                  </span>
                  <span
                    className="px-1 text-[11px] leading-[13px]"
                    style={selected === item.id ? { background: "#000080", color: "#fff", outline: "1px dotted #fff" } : undefined}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="border border-[#808080] bg-white">
              <div className="grid h-[22px] grid-cols-[minmax(160px,1.4fr)_140px_80px_150px] bg-[#c0c0c0] font-bold">
                {["Name", "Type", "Size", "Modified"].map((heading) => (
                  <div key={heading} className="border-r border-[#808080] px-2 py-[3px]">{heading}</div>
                ))}
              </div>
              {items.map((item) => (
                <button
                  key={item.id}
                  className="grid h-[24px] w-full grid-cols-[minmax(160px,1.4fr)_140px_80px_150px] text-left hover:bg-[#000080]/10"
                  style={selected === item.id ? { background: "#000080", color: "#fff" } : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelected(item.id);
                    playSound("click");
                  }}
                  onDoubleClick={() => openItem(item)}
                >
                  <div className="flex min-w-0 items-center gap-1 px-2">
                    <img src={`/icons/${item.icon}.png`} alt="" width={16} height={16} draggable={false} style={{ imageRendering: "pixelated" }} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="truncate px-2 py-[4px]">{itemType(item)}</div>
                  <div className="truncate px-2 py-[4px] text-right">{itemSize(item)}</div>
                  <div className="truncate px-2 py-[4px]">{itemModified(item)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex h-[20px] items-center border-t border-[#808080] bg-[#c0c0c0] px-2">
        <div className="flex-1 border-r border-[#808080] pr-2 text-[10px]">{items.length} object(s)</div>
        <div className="flex items-center gap-1 pl-2">
          <img src="/icons/computer.png" alt="" width={14} height={14} draggable={false} style={{ imageRendering: "pixelated" }} />
          <span className="text-[10px]">My Computer</span>
        </div>
      </div>

      {viewer && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 p-5">
          <div
            className="w-[min(440px,92%)] bg-[#c0c0c0] p-[3px]"
            style={{
              boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
            }}
          >
            <div className="flex h-[18px] items-center justify-between bg-gradient-to-r from-[#000080] to-[#1084d0] px-[4px]">
              <span className="truncate text-[11px] font-bold text-white">{viewer.label} - Notepad</span>
              <button className="win-button flex h-[14px] min-h-0 w-[16px] items-center justify-center p-0 text-[10px]" onClick={() => setViewer(null)}>
                ×
              </button>
            </div>
            <div className="border-b border-[#808080] px-1 py-[2px]">
              {["File", "Edit", "Search", "Help"].map((item) => (
                <span key={item} className="cursor-default px-2 hover:underline">
                  {item}
                </span>
              ))}
            </div>
            <pre className="h-[220px] overflow-auto whitespace-pre-wrap bg-white p-2 font-mono text-[12px] leading-[15px] text-black">
              {viewer.content}
            </pre>
            <div className="mt-[6px] flex justify-end">
              <button className="win-button min-w-[70px]" onClick={() => setViewer(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
