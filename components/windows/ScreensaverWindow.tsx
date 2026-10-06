"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import type { WindowComponentProps } from "@/lib/windows";
import { WALLPAPER_LIST, WALLPAPERS, type WallpaperId, isWallpaperId, wallpaperSwatchStyle } from "@/lib/wallpapers";
import { Win98Select } from "@/components/ui/Win98Select";

type Mode = "pipes" | "stars" | "maze" | "mystify" | "flying-windows";

const OPTIONS: { value: Mode; label: string }[] = [
  { value: "flying-windows", label: "Flying Windows" },
  { value: "stars", label: "Starfield Simulation" },
  { value: "pipes", label: "3D Pipes" },
  { value: "maze", label: "3D Maze" },
  { value: "mystify", label: "Mystify Your Mind" },
];

const TABS = ["Background", "Screen Saver", "Settings"];

const RESOLUTIONS = [
  "640 by 480 pixels",
  "800 by 600 pixels",
  "1024 by 768 pixels",
  "1152 by 864 pixels",
  "1280 by 1024 pixels",
];

function MonitorPreview({ children }: { children: ReactNode }) {
  const bevelRaised =
    "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf";
  return (
    <div className="flex flex-col items-center">
      <div className="bg-[#c0c0c0] p-[10px] pb-[14px]" style={{ width: 188, boxShadow: bevelRaised }}>
        <div className="field-border bg-black p-[2px]">
          <div className="relative overflow-hidden" style={{ height: 104, background: "#000" }}>
            {children}
          </div>
        </div>
      </div>
      <div className="h-[8px] w-[58px] bg-[#c0c0c0]" style={{ boxShadow: bevelRaised }} />
      <div className="h-[6px] w-[96px] bg-[#c0c0c0]" style={{ boxShadow: bevelRaised }} />
    </div>
  );
}

/** Fills the monitor screen with the given wallpaper. */
function WallpaperScreen({ id }: { id: WallpaperId }) {
  const wp = WALLPAPERS[id];
  if (wp.className === "floppyy-wallpaper") {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/wallpapers/clouds.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }
  if (wp.image) {
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url('${wp.image}')`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
    );
  }
  return <div className="absolute inset-0" style={{ background: wp.color ?? "#008080" }} />;
}

function PreviewContent({ mode }: { mode: Mode }) {
  if (mode === "stars") {
    const dots = Array.from({ length: 26 });
    return (
      <div className="absolute inset-0">
        {dots.map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: (i % 3) + 1,
              height: (i % 3) + 1,
              opacity: 0.5 + ((i % 5) / 10),
            }}
          />
        ))}
      </div>
    );
  }
  if (mode === "flying-windows") {
    return (
      <div className="absolute inset-0">
        {[
          { left: "12%", top: "20%", s: 14 },
          { left: "55%", top: "10%", s: 20 },
          { left: "70%", top: "55%", s: 12 },
          { left: "30%", top: "60%", s: 24 },
          { left: "45%", top: "38%", s: 16 },
        ].map((w, i) => (
          <img
            key={i}
            src="/icons/win.png"
            alt=""
            draggable={false}
            style={{ position: "absolute", left: w.left, top: w.top, width: w.s, height: w.s, imageRendering: "pixelated" }}
          />
        ))}
      </div>
    );
  }
  if (mode === "pipes") {
    return (
      <svg viewBox="0 0 184 104" className="absolute inset-0 h-full w-full">
        <path d="M20 80 L20 40 L60 40 L60 70 L110 70" fill="none" stroke="#39d0d0" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M120 20 L120 55 L150 55 L150 90" fill="none" stroke="#d04ad0" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 95 L90 95 L90 30" fill="none" stroke="#d0c040" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (mode === "maze") {
    return (
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: i % 3 === 0 ? "#8a1f1f" : i % 3 === 1 ? "#b0b0b0" : "#6a1414",
              boxShadow: "inset -1px -1px rgba(0,0,0,0.5), inset 1px 1px rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>
    );
  }
  return (
    <svg viewBox="0 0 184 104" className="absolute inset-0 h-full w-full">
      <polygon points="30,20 150,35 120,90 40,70" fill="none" stroke="#33ffff" strokeWidth="2" />
      <polygon points="60,15 160,60 90,95 25,55" fill="none" stroke="#ff44ff" strokeWidth="2" />
    </svg>
  );
}

export function ScreensaverWindow({
  startScreensaver,
  setDefaultScreensaver,
  closeWindow,
  window: win,
  playSound,
  wallpaper,
  setWallpaper,
  screensaverMode = "flying-windows",
  screensaverWait = 1,
  setScreensaverWait,
  resetDesktopLayout,
}: WindowComponentProps) {
  const [activeTab, setActiveTab] = useState(() =>
    win.payload === "settings" ? "Settings" : win.payload === "screensaver" ? "Screen Saver" : "Background",
  );
  const [selected, setSelected] = useState<Mode>(screensaverMode);
  const [waitMinutes, setWaitMinutes] = useState(screensaverWait);
  const [colorDepth, setColorDepth] = useState("High Color (16 bit)");
  const [resIndex, setResIndex] = useState(1);
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperId>(() =>
    isWallpaperId(wallpaper) ? wallpaper : "clouds",
  );

  const apply = () => {
    setDefaultScreensaver?.(selected);
    setScreensaverWait?.(Math.max(1, Math.min(60, waitMinutes)));
    setWallpaper?.(selectedWallpaper);
    playSound("click");
  };

  const pickWallpaper = (id: WallpaperId) => {
    setSelectedWallpaper(id);
    playSound("click");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#c0c0c0] p-[6px] text-[11px] sm:p-[14px]">
      <div className="relative z-[2] flex gap-[5px] px-[2px]">
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-t-[3px] px-[12px] text-[11px] ${active ? "relative z-[3] bg-[#c0c0c0] pt-[4px] pb-[5px]" : "mt-[2px] bg-[#c0c0c0] pt-[2px] pb-[3px]"}`}
              style={{
                boxShadow: "inset 1px 1px #ffffff, inset -1px -1px #808080",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div
        className="-mt-px flex min-h-0 flex-1 flex-col overflow-auto bg-[#c0c0c0] px-[8px] py-[12px] sm:px-[24px] sm:py-[16px]"
        style={{ boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf" }}
      >
        <div className="mb-[12px] flex justify-center">
          <MonitorPreview>
            {activeTab === "Screen Saver" ? (
              <PreviewContent mode={selected} />
            ) : (
              <WallpaperScreen id={selectedWallpaper} />
            )}
          </MonitorPreview>
        </div>

        {activeTab === "Background" && (
          <fieldset className="mb-[10px] flex min-h-0 flex-1 flex-col border border-[#808080] px-[10px] pb-[10px] pt-[2px]">
            <legend className="px-[4px]">Wallpaper</legend>
            <div
              className="min-h-0 flex-1 overflow-y-auto bg-white p-[2px]"
              style={{ boxShadow: "inset 1px 1px #0a0a0a, inset -1px -1px #dfdfdf" }}
            >
              {WALLPAPER_LIST.map((wp) => {
                const active = wp.id === selectedWallpaper;
                return (
                  <button
                    key={wp.id}
                    onClick={() => pickWallpaper(wp.id)}
                    className="flex w-full items-center gap-[8px] px-[6px] py-[3px] text-left text-[12px]"
                    style={{ background: active ? "#000080" : "transparent", color: active ? "#ffffff" : "#000000" }}
                  >
                    <span
                      className="h-[14px] w-[18px] shrink-0 border border-[#808080]"
                      style={wallpaperSwatchStyle(wp)}
                    />
                    {wp.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {activeTab === "Screen Saver" && (
          <>
        <fieldset className="mb-[10px] border border-[#808080] px-[10px] pb-[10px] pt-[2px]">
          <legend className="px-[4px]">Screen Saver</legend>
          <div className="grid grid-cols-2 items-center gap-[6px] sm:flex">
            <Win98Select
              value={selected}
              onChange={(v) => setSelected(v as Mode)}
              options={OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              ariaLabel="Screen saver"
              className="col-span-2 min-w-0 flex-1"
            />
            <button
              className="win-button min-w-[72px]"
              disabled
            >
              Settings...
            </button>
            <button className="win-button min-w-[72px]" onClick={() => startScreensaver(selected)}>
              Preview
            </button>
          </div>
          <div className="mt-[10px] flex flex-wrap items-center gap-[8px]">
            <label className="flex items-center gap-[5px]">
              <input
                type="checkbox"
                checked={false}
                disabled
                readOnly
              />
              Password protected
            </label>
            <button className="win-button min-w-[68px]" disabled>
              Change...
            </button>
            <span className="ml-auto flex items-center gap-[5px]">
              Wait:
              <input
                type="number"
                aria-label="Screen saver wait in minutes"
                min={1}
                max={60}
                value={waitMinutes}
                onChange={(event) => setWaitMinutes(Math.min(60, Math.max(1, Number(event.target.value) || 1)))}
                className="field-border h-[20px] w-[44px] bg-white px-[4px] text-right text-[11px] text-black"
              />
              minutes
            </span>
          </div>
        </fieldset>

        <fieldset className="border border-[#808080] px-[10px] pb-[10px] pt-[2px] text-[#808080]">
          <legend className="px-[4px] text-[#404040]">Energy saving features of monitor</legend>
          <div className="flex items-start gap-[10px]">
            <div
              className="mt-[2px] flex h-[34px] w-[44px] shrink-0 items-center justify-center text-[9px] font-bold italic"
              style={{
                background: "radial-gradient(circle at 50% 120%, #2e7d32 0 60%, #1b5e20 100%)",
                color: "#ffe14d",
                borderRadius: "0 0 22px 22px",
              }}
            >
              energy
            </div>
            <div className="flex-1">
              <label className="mb-[6px] flex items-center gap-[5px]">
                <input type="checkbox" disabled />
                Low-power standby
              </label>
              <label className="flex items-center gap-[5px]">
                <input type="checkbox" disabled />
                Shut off monitor
              </label>
            </div>
          </div>
        </fieldset>
          </>
        )}

        {activeTab === "Settings" && (
          <>
            <div className="mb-[10px] text-[11px]">
              <div>Display:</div>
              <div className="font-bold">Default Monitor on S3 Trio32/64 PCI (732/764)</div>
            </div>
            <div className="flex flex-col gap-[12px] sm:flex-row">
              <fieldset className="flex-1 border border-[#808080] px-[10px] pb-[10px] pt-[2px]">
                <legend className="px-[4px]">Colors</legend>
                <Win98Select
                  disabled
                  value={colorDepth}
                  onChange={setColorDepth}
                  ariaLabel="Colors"
                  className="w-full"
                  options={[
                    { value: "16 Color", label: "16 Color" },
                    { value: "256 Color", label: "256 Color" },
                    { value: "High Color (16 bit)", label: "High Color (16 bit)" },
                    { value: "True Color (24 bit)", label: "True Color (24 bit)" },
                  ]}
                />
                <div
                  className="mt-[10px] h-[12px] w-full border border-[#808080]"
                  style={{
                    background:
                      "linear-gradient(90deg, #000000, #7f0000, #ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ffffff)",
                  }}
                />
              </fieldset>
              <fieldset disabled className="pointer-events-none flex-1 border border-[#808080] px-[10px] pb-[10px] pt-[2px] opacity-60" aria-disabled="true">
                <legend className="px-[4px]">Screen area</legend>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Less</span>
                  <span>More</span>
                </div>
                <ScreenAreaSlider index={resIndex} count={RESOLUTIONS.length} onChange={setResIndex} />
                <div className="text-center text-[11px]">{RESOLUTIONS[resIndex]}</div>
              </fieldset>
            </div>
            <label className="mt-[12px] flex items-center gap-[5px] text-[#808080]">
              <input type="checkbox" checked readOnly disabled />
              Extend my Windows desktop onto this monitor.
            </label>
            <div className="mt-[10px] flex justify-end">
              <button
                className="win-button min-w-[92px]"
                disabled
              >
                Advanced...
              </button>
            </div>
          </>
        )}

        {activeTab === "Settings" && <button className="win-button mt-3 self-start" onClick={resetDesktopLayout}>Restore Desktop Layout</button>}
      </div>

        <div className="flex shrink-0 justify-end gap-[6px] pt-[10px]">
          <button
            className="win-button min-w-[72px]"
            onClick={() => {
              apply();
              closeWindow(win.instanceId);
            }}
          >
            OK
          </button>
          <button className="win-button min-w-[72px]" onClick={() => closeWindow(win.instanceId)}>
            Cancel
          </button>
          <button className="win-button min-w-[72px]" onClick={apply}>
            Apply
          </button>
        </div>
    </div>
  );
}

/** Windows 98 horizontal trackbar for the "Screen area" resolution stepper. */
function ScreenAreaSlider({ index, count, onChange }: { index: number; count: number; onChange: (i: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const setFromX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const i = Math.round(ratio * (count - 1));
      onChange(Math.max(0, Math.min(count - 1, i)));
    },
    [count, onChange],
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => setFromX(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, setFromX]);

  const pct = count > 1 ? (index / (count - 1)) * 100 : 0;

  return (
    <div
      ref={trackRef}
      className="relative my-[6px] h-[22px] cursor-default select-none"
      onPointerDown={(e) => {
        e.preventDefault();
        setDragging(true);
        setFromX(e.clientX);
      }}
    >
      <div
        className="absolute left-0 right-0 top-1/2 h-[4px] -translate-y-1/2"
        style={{ background: "#808080", boxShadow: "inset -1px -1px #ffffff, inset 1px 1px #0a0a0a" }}
      />
      <div
        className="absolute top-1/2 h-[18px] w-[11px] -translate-x-1/2 -translate-y-1/2 bg-[#c0c0c0]"
        style={{
          left: `${pct}%`,
          boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
        }}
      />
    </div>
  );
}
