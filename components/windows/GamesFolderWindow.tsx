"use client";

import { useState } from "react";
import type { WindowComponentProps, WindowId } from "@/lib/windows";
import { ToolbarIcon } from "./ToolbarIcon";
import { FloppyyIcon } from "@/components/desktop/FloppyyIcon";

import { GAME_REGISTRY as GAMES, type GameEntry } from "@/lib/gameRegistry";

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

export function GamesFolderWindow({ window: win, openWindow, closeWindow, notify, playSound }: WindowComponentProps) {
  const [selected, setSelected] = useState<WindowId | null>(null);
  const [viewMode, setViewMode] = useState<"icons" | "details">("icons");
  const selectedGame = GAMES.find((game) => game.id === selected);

  const open = (game: GameEntry) => {
    playSound("open");
    openWindow(game.id);
  };

  const runToolbar = (action: string, label: string) => {
    if (action === "up" || action === "back") {
      // Up one level = back to the Desktop, which just means closing the folder.
      playSound("click");
      closeWindow(win.instanceId);
      return;
    }
    if (action === "properties" && selectedGame) {
      notify(`${selectedGame.label}: ${selectedGame.description}`);
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
    <div className="flex h-full flex-col bg-[#c0c0c0] text-[11px]">
      {/* Menu bar */}
      <div className="flex h-[20px] items-center border-b border-[#808080] px-1">
        {["File", "Edit", "View", "Go", "Favorites", "Help"].map((item) => (
          <span key={item} className="cursor-default px-2 hover:underline">
            {item}
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex h-[50px] items-center gap-0 border-b border-[#808080] px-1">
        {toolbarButtons.map((button) => (
          <button
            key={button.label}
            disabled={button.action === "noop" || (button.action === "properties" && !selectedGame)}
            className="group flex h-[44px] w-[50px] cursor-default flex-col items-center justify-center text-[10px] hover:bg-[#dfdfdf] disabled:opacity-50 max-sm:disabled:hidden"
            onClick={() => runToolbar(button.action, button.label)}
          >
            <span className="flex h-[20px] items-center justify-center grayscale transition-[filter] duration-150 group-hover:grayscale-0">
              <ToolbarIcon name={button.icon} />
            </span>
            <span className="mt-[2px]">{button.label}</span>
          </button>
        ))}
      </div>

      {/* Address bar */}
      <div className="flex h-[24px] items-center gap-1 border-b border-[#808080] px-2">
        <span className="mr-1 text-[11px] font-bold">Address</span>
        <div className="flex h-[18px] flex-1 items-center border border-[#808080] bg-white px-1">
          <img src="/icons/directory_check.png" alt="" width={16} height={16} draggable={false} style={{ imageRendering: "pixelated" }} />
          <span className="ml-1 text-[11px]">C:\WINDOWS\Desktop\Games</span>
        </div>
      </div>

      {/* Body: info panel + icon area */}
      <div className="flex min-h-0 flex-1 border-t border-[#dfdfdf] bg-white">
        <aside
          className="relative hidden w-[150px] shrink-0 flex-col overflow-hidden border-r border-[#c0c0c0] p-3 sm:flex"
          style={{
            background:
              "radial-gradient(circle at 8% 20%, rgba(255,255,255,0.95) 0 18%, rgba(255,255,255,0) 34%), linear-gradient(135deg, #d9f5ff 0%, #ffffff 52%, #ffffff 100%)",
          }}
        >
          <img src="/icons/directory_check.png" alt="" width={40} height={40} draggable={false} style={{ imageRendering: "pixelated" }} />
          <h2 className="mt-2 text-[18px] font-bold leading-[20px]">Games</h2>
          <div className="mt-2 h-[2px] w-full bg-gradient-to-r from-[#ff0000] via-[#ffff00] via-[#00c853] to-[#0000ff]" />
          <p className="mt-3 text-[11px] leading-[14px]">
            {selectedGame ? selectedGame.description : "Select an item to view its description."}
          </p>
        </aside>

        <div className="flex-1 overflow-auto p-4" onClick={() => setSelected(null)}>
          {viewMode === "icons" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] content-start gap-x-3 gap-y-3">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  className="flex cursor-default flex-col items-center justify-start gap-1 p-1 text-center"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelected(game.id);
                    playSound("click");
                  }}
                  onDoubleClick={() => open(game)}
                  onPointerUp={(event) => { if (event.pointerType === "touch") open(game); }}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); open(game); } }}
                >
                  <span
                    className="relative inline-flex h-[36px] w-[36px] items-center justify-center p-[2px]"
                    style={selected === game.id ? { background: "rgba(0,0,128,0.4)" } : undefined}
                  >
                    <FloppyyIcon type={game.icon} size={32} />
                    {/* Windows 98 shortcut arrow overlay */}
                    <span className="absolute bottom-0 left-0 flex h-[11px] w-[11px] items-center justify-center border border-[#808080] bg-white">
                      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" style={{ display: "block" }}>
                        <path d="M1 7 L1 2 L6 2" fill="none" stroke="#000" strokeWidth="1" />
                        <path d="M3.5 2 L6.5 2 L6.5 5" fill="none" stroke="#000" strokeWidth="1" />
                        <path d="M6 2 L2.5 5.5" stroke="#000" strokeWidth="1" />
                      </svg>
                    </span>
                  </span>
                  <span
                    className="px-[3px] leading-[13px]"
                    style={selected === game.id ? { background: "#000080", color: "#fff", outline: "1px dotted #fff" } : undefined}
                  >
                    {game.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="border border-[#808080]">
              <div className="grid h-[22px] grid-cols-[minmax(200px,1.6fr)_1fr] bg-[#c0c0c0] font-bold">
                {["Name", "Type"].map((heading) => (
                  <div key={heading} className="border-r border-[#808080] px-2 py-[3px]">{heading}</div>
                ))}
              </div>
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  className="grid h-[24px] w-full grid-cols-[minmax(200px,1.6fr)_1fr] text-left hover:bg-[#000080]/10"
                  style={selected === game.id ? { background: "#000080", color: "#fff" } : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelected(game.id);
                    playSound("click");
                  }}
                  onDoubleClick={() => open(game)}
                  onPointerUp={(event) => { if (event.pointerType === "touch") open(game); }}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); open(game); } }}
                >
                  <div className="flex min-w-0 items-center gap-1 px-2">
                    <FloppyyIcon type={game.icon} size={16} />
                    <span className="truncate">{game.label}</span>
                  </div>
                  <div className="truncate px-2 py-[4px]">Shortcut</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex h-[20px] items-center border-t border-[#808080] px-2">
        <div className="flex-1 truncate border-r border-[#808080] pr-2 text-[10px]">{GAMES.length} object(s)</div>
        <div className="pl-2 text-[10px]">Double-click to play</div>
      </div>
    </div>
  );
}
