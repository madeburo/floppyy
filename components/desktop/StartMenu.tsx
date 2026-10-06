"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { WindowId } from "@/lib/windows";
import { GAME_REGISTRY } from "@/lib/gameRegistry";
import { FloppyyIcon } from "./FloppyyIcon";

type Props = {
  onOpen: (id: WindowId, payload?: string) => void;
  onScreensaver: () => void;
  onShutdown: () => void;
  onNotify: (message: string, options?: { icon?: string; titleIcon?: string; persistent?: boolean }) => void;
};
type Entry = { label: string; icon: string; action: () => void };
const menuShadow = "inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf";

export function StartMenu({ onOpen, onScreensaver, onShutdown, onNotify }: Props) {
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [position, setPosition] = useState({ left: 220, top: 8 });
  const anchors = useRef<Record<string, HTMLButtonElement | null>>({});
  const panel = useRef<HTMLDivElement>(null);
  const entries: Record<string, Entry[]> = {
    Programs: [
      ["internet", "Dial-Up Networking", "dialup"], ["music", "Winamp", "winamp"],
      ["paint", "Paint", "paint"], ["netscape", "Netscape Navigator", "netscape"],
      ["msdos", "MS-DOS Prompt", "prompt"], ["outlook", "Outlook Express", "msoutlook"],
      ["guestbook", "Guest Book", "guestbook"],
    ].map(([id, label, icon]) => ({ label, icon, action: () => onOpen(id as WindowId) })),
    Games: GAME_REGISTRY.map((game) => ({ label: game.label.replace(/\.exe$/i, ""), icon: game.icon, action: () => onOpen(game.id) })),
    Favorites: [
      ["Lycos", "https://web.archive.org/web/19961225002710/http://www.lycos.com/"],
      ["AltaVista", "https://web.archive.org/web/19961023234631/http://altavista.digital.com/"],
      ["AOL", "https://web.archive.org/web/19961219002550/http://www.aol.com/"],
      ["Yahoo", "https://web.archive.org/web/19961017235908/http://www.yahoo.com/"],
      ["Amazon", "https://web.archive.org/web/19961112181513/http://www.amazon.com/"],
      ["eBay", "https://web.archive.org/web/19961112181513/http://www.ebay.com/"],
    ].map(([label, url]) => ({ label, icon: "html", action: () => onOpen("ie-browser", url) })),
    Settings: [
      { label: "Control Panel", icon: "control-panel", action: () => onOpen("control-panel") },
      { label: "Display Settings", icon: "gears", action: () => onOpen("screensaver", "settings") },
      { label: "Dial-Up Networking", icon: "dialup", action: () => onOpen("internet") },
      { label: "Screensaver", icon: "monitor_windows", action: onScreensaver },
      { label: "Windows Update...", icon: "windows_update", action: () => onNotify("Windows Update: No updates required. This is already the most nostalgic OS ever made.", { icon: "/favicon.png", titleIcon: "/icons/windows_update.png", persistent: true }) },
    ],
  };
  useLayoutEffect(() => {
    if (!openSub) return;
    const place = () => {
      const anchor = anchors.current[openSub]?.getBoundingClientRect();
      if (!anchor || !panel.current) return;
      setPosition({
        left: Math.max(8, Math.min(anchor.right, window.innerWidth - 218)),
        top: Math.max(8, Math.min(anchor.top, window.innerHeight - 36 - panel.current.offsetHeight)),
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [openSub]);

  const command = (label: string, icon: string, action: () => void) => (
    <button key={label} className="menu-command start-command flex items-center gap-2" onClick={action} onMouseEnter={() => setOpenSub(null)}>
      <FloppyyIcon type={icon} size={16} /><span>{label}</span>
    </button>
  );
  return (
    <div role="navigation" aria-label="Start menu" className="fixed bottom-[28px] left-0 z-[4500] flex w-[220px] max-w-[calc(100vw-8px)] bg-[#c0c0c0]" style={{ boxShadow: menuShadow }} onClick={(event) => event.stopPropagation()}>
      <div title="Double click" onDoubleClick={() => onOpen("about", "welcome")} className="flex w-[26px] shrink-0 items-end justify-center bg-[#000080] pb-6">
        <span className="-rotate-90 whitespace-nowrap text-[12px] font-bold text-white">floppyy</span>
      </div>
      <div className={`min-w-0 flex-1 overflow-y-auto py-[3px] max-h-[calc(100dvh-44px)] ${openSub ? "max-sm:hidden" : ""}`}>
        {command("About", "credits", () => onOpen("about", "welcome"))}
        {command("Projects", "directory_net", () => onOpen("projects"))}
        <hr className="my-1 border-[#808080]" />
        {Object.keys(entries).map((name) => (
          <button key={name} ref={(element) => { anchors.current[name] = element; }} className="menu-command start-command flex items-center gap-2"
            aria-expanded={openSub === name} aria-controls={`start-${name}`}
            onClick={() => setOpenSub(window.innerWidth >= 640 ? name : openSub === name ? null : name)}
            onPointerEnter={(event) => { if (event.pointerType === "mouse" && window.innerWidth >= 640) setOpenSub(name); }}>
            <FloppyyIcon type={name === "Games" ? "directory_check" : name === "Programs" ? "directory_open" : name === "Favorites" ? "fav" : "gears"} size={16} />
            <span>{name}</span><span className="ml-auto" aria-hidden="true">›</span>
          </button>
        ))}
        <hr className="my-1 border-[#808080]" />
        {command("My Computer", "computer", () => onOpen("computer"))}
        {command("Norton Commander", "console", () => onOpen("norton"))}
        {command("Disk Defragmenter", "defrag", () => onOpen("defrag"))}
        {command("Help", "help", () => onOpen("help"))}
        {command("Run...", "run", () => onOpen("run"))}
        <hr className="my-1 border-[#808080]" />
        {command("Shut Down...", "shutdown", onShutdown)}
      </div>
      {openSub && <div ref={panel} id={`start-${openSub}`} aria-label={openSub} className="start-submenu min-w-0 flex-1 overflow-y-auto bg-[#c0c0c0] py-[3px] sm:fixed sm:w-[210px] max-h-[calc(100dvh-44px)]" style={{ "--menu-left": `${position.left}px`, "--menu-top": `${position.top}px`, boxShadow: menuShadow } as React.CSSProperties}>
        <button className="menu-command start-command sm:hidden" onClick={() => setOpenSub(null)}>Back</button>
        {entries[openSub].map((entry) => <button key={entry.label} className="menu-command start-command flex items-center gap-2" onClick={entry.action}>
          <FloppyyIcon type={entry.icon} size={16} /><span className="min-w-0 break-words">{entry.label}</span>
        </button>)}
      </div>}
    </div>
  );
}
