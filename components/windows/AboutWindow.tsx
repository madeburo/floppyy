"use client";

import { useState } from "react";
import type { WindowComponentProps } from "@/lib/windows";
import { SHORT_VERSION } from "@/lib/version";

type AboutPanel = "welcome" | "nostalgia" | "credits" | "connect" | "support";

const panels: Array<{ id: AboutPanel; label: string }> = [
  { id: "welcome", label: "Welcome" },
  { id: "credits", label: "Credits" },
  { id: "nostalgia", label: "Discover Floppyy" },
  { id: "connect", label: "Connect" },
  { id: "support", label: "Support Floppyy" },
];

export function AboutWindow({ window, closeWindow, playSound }: WindowComponentProps) {
  const [activePanel, setActivePanel] = useState<AboutPanel>("welcome");
  const [showOnBoot, setShowOnBoot] = useState(true);

  const setPanel = (panel: AboutPanel) => {
    setActivePanel(panel);
    playSound("click");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f3f7fb] text-[12px]">
      <div
        className="relative h-[100px] shrink-0 overflow-hidden border-b border-[#d7d7d7]"
        style={{
          backgroundImage: "url('/wallpapers/clouds.jpg')",
          backgroundPosition: "center 36%",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-white/25" />
        <div className="absolute bottom-[18px] left-[34px] flex items-end gap-2">
          <img
            src="/icons/win.png"
            alt=""
            width={30}
            height={26}
            draggable={false}
            style={{ imageRendering: "pixelated" }}
          />
          <div className="leading-none">
            <div className="text-[13px]">Floppyy</div>
            <div className="text-[26px] font-bold tracking-normal">Welcome</div>
          </div>
        </div>
        <div className="absolute bottom-[17px] left-0 right-0 h-[1px] bg-gradient-to-r from-[#ff3030] via-[#33c955] to-[#2f67ff]" />
      </div>

      <div className="flex min-h-0 flex-1 bg-white/85">
        <aside className="w-[190px] shrink-0 px-[14px] py-[14px]">
          <div className="mb-[6px] bg-black px-[10px] py-[2px] text-[11px] font-bold tracking-[0.32em] text-white">
            CONTENTS
          </div>
          <div className="border-r border-[#d0d0d0]">
            {panels.map((panel, index) => (
              <button
                key={panel.id}
                className={[
                  "relative flex h-[26px] w-full items-center border-b border-[#d7d7d7] bg-transparent px-[10px] text-left font-bold",
                  activePanel === panel.id ? "text-black" : "text-[#333333]",
                ].join(" ")}
                onClick={() => setPanel(panel.id)}
              >
                {activePanel === panel.id && (
                  <span
                    className="absolute bottom-[3px] left-0 top-[3px] w-[4px]"
                    style={{ background: index % 2 === 0 ? "#00a2ff" : "#ff2d1a" }}
                  />
                )}
                <span className="truncate">{panel.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="relative min-h-0 min-w-0 flex-1 overflow-auto px-[16px] py-[18px]">
          <div
            className="pointer-events-none absolute bottom-[14px] right-[18px] h-[150px] w-[190px] opacity-20"
            style={{
              backgroundImage: "url('/icons/win.png')",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
              imageRendering: "pixelated",
            }}
          />
          <PanelContent activePanel={activePanel} setPanel={setPanel} />
        </main>
      </div>

      <div className="flex h-[36px] shrink-0 items-center justify-between border-t border-[#d7d7d7] bg-[#f8fbff] px-[12px]">
        <label className="flex items-center gap-[5px]">
          <input
            type="checkbox"
            checked={showOnBoot}
            onChange={(event) => {
              setShowOnBoot(event.target.checked);
              playSound("click");
            }}
          />
          <span>Show this screen each time Floppyy starts.</span>
        </label>
        <button className="win-button min-w-[74px]" onClick={() => closeWindow(window.instanceId)}>
          Close
        </button>
      </div>
    </div>
  );
}

function PanelContent({
  activePanel,
  setPanel,
}: {
  activePanel: AboutPanel;
  setPanel: (panel: AboutPanel) => void;
}) {
  if (activePanel === "nostalgia") {
    return (
      <section className="relative max-w-[300px] space-y-[12px]">
        <h2 className="text-[20px] font-bold">Discover Floppyy</h2>
        <p>Boot up, click around, remember everything — minus the dial-up wait. Mostly.</p>
        <p>Pixel windows, floppy disks, BIOS boot screens, Winamp vibes, classic games, and the early web are rebuilt here as a playful browser desktop.</p>
        <p>No AI, no AI agents, no social media. That was the golden era.</p>
        <p>Not an emulator. Not a productivity tool. Just a small machine for good old internet memories.</p>
      </section>
    );
  }

  if (activePanel === "credits") {
    return (
      <section className="relative max-w-[315px] space-y-[10px]">
        <h2 className="text-[20px] font-bold">Credits</h2>
        <p>Floppyy Version {SHORT_VERSION}</p>
        <p className="border-t border-[#d0d0d0] pt-[8px] text-[11px] leading-[1.5] text-[#333333]">
          All rights to logos, names, music, games, and other materials belong to their respective
          owners. This project was created purely as a tribute to the 1990s. If you would like to add
          or remove your project from Floppyy, please write to <span className="font-mono">hi@floppyy.com</span>.
        </p>
      </section>
    );
  }

  if (activePanel === "connect") {
    return (
      <section className="relative max-w-[300px] space-y-[12px]">
        <h2 className="text-[20px] font-bold">Connect</h2>
        <p>Floppyy lives at <a className="text-[#0000ff] underline" href="https://www.floppyy.com" target="_blank" rel="noopener noreferrer">www.floppyy.com</a>.</p>
        <p>The current GitHub home is <a className="text-[#0000ff] underline" href="https://github.com/floppyyos" target="_blank" rel="noopener noreferrer">github.com/floppyyos</a>.</p>
        <p>Say hello at <a className="text-[#0000ff] underline" href="mailto:hi@floppyy.com">hi@floppyy.com</a>.</p>
      </section>
    );
  }

  if (activePanel === "support") {
    return (
      <section className="relative max-w-[315px] space-y-[12px]">
        <h2 className="text-[20px] font-bold">Support Floppyy</h2>
        <p>Floppyy is a free nostalgic trip back to the old web. Every coffee helps keep it online and growing.</p>
        <div className="flex gap-[8px]">
          <a
            className="win-button flex min-w-[98px] items-center justify-center gap-[6px] px-[10px]"
            href="https://ko-fi.com/floppyyos"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/support/kofi.png" alt="" width={16} height={16} style={{ imageRendering: "pixelated" }} draggable={false} />
            Ko-fi
          </a>
          <a
            className="win-button flex min-w-[98px] items-center justify-center gap-[6px] px-[10px]"
            href="https://paypal.me/UmidM"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/support/paypal.png" alt="" width={16} height={16} style={{ imageRendering: "pixelated" }} draggable={false} />
            PayPal
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="relative max-w-[300px] space-y-[12px]">
      <img
        src="/floppyy.png"
        alt="Floppyy"
        className="mb-[2px] h-auto w-[178px]"
        draggable={false}
      />
      <h2 className="text-[20px] font-bold">Welcome</h2>
      <p>Welcome to the web you grew up on, where your browser desktop meets the Internet memories you almost forgot.</p>
      <p>Sit back and take a brief tour of a tiny retro machine made from clouds, clicks, windows, games, and floppy-disk feelings.</p>
      <p>If you want to explore an option, just click it.</p>
      <button className="win-button mt-[2px] min-w-[92px]" onClick={() => setPanel("credits")}>
        Credits
      </button>
    </section>
  );
}
