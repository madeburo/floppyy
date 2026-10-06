"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { GameMenuBar, GameStatusBar } from "./GameChrome";
import { useWindowActivity } from "@/components/windows/WindowActivity";
import { Win98Dialog } from "@/components/ui/Win98Dialog";
import { isTextInput } from "@/lib/keyboard";

export type GameProps = { playSound: (name: string) => void; onExit?: () => void; windowWidth?: number };

export const cellOutset = "inset -1px -1px #808080, inset 1px 1px #fff";
export const cellInset = "inset 1px 1px #808080, inset -1px -1px #fff";

export function useHighScore(key: string) {
  const [best, setBest] = useState(() => {
    try {
      const value = Number(globalThis.localStorage.getItem(key) ?? 0);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch {
      return 0;
    }
  });
  const record = useCallback((score: number) => {
    setBest((current) => {
      if (score <= current) return current;
      try {
        globalThis.localStorage.setItem(key, String(score));
      } catch {
        /* ignore */
      }
      return score;
    });
  }, [key]);
  return [best, record] as const;
}

export { useTick } from "@/hooks/useTick";

export function useGameSession() {
  const { active } = useWindowActivity();
  const [paused, setPaused] = useState(false);
  return { playing: active && !paused, paused, togglePause: () => setPaused((value) => !value), resume: () => setPaused(false) };
}

export function useGameKeys(enabled: boolean, keys: Record<string, () => void>) {
  const handle = useEffectEvent((event: KeyboardEvent) => {
    if (isTextInput(event.target) || (event.target instanceof HTMLElement && event.target.closest('[aria-modal="true"]'))) return;
    if (!keys[event.key]) return;
    event.preventDefault();
    keys[event.key]();
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => handle(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

export function Shell({ title, score, best, onExit, onReset, children, status, controls, session, result }: {
  title: string;
  score: number;
  best: number;
  onExit?: () => void;
  onReset: () => void;
  children: React.ReactNode;
  status?: string;
  controls?: React.ReactNode;
  session: ReturnType<typeof useGameSession>;
  result?: string;
}) {
  const { active } = useWindowActivity();
  const newGame = () => { session.resume(); onReset(); };
  useGameKeys(active, { F2: newGame, p: session.togglePause, P: session.togglePause });
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#c0c0c0] text-[11px]">
      <GameMenuBar
        items={[
          {
            label: "Game",
            menu: [
              { label: "New", shortcut: "F2", onClick: newGame },
              { label: session.paused ? "Resume" : "Pause", shortcut: "P", onClick: session.togglePause, disabled: Boolean(result) },
              { label: "Exit", separatorBefore: true, onClick: onExit },
            ],
          },
          { label: "Help", menu: [{ label: `About ${title}`, disabled: true }] },
        ]}
      />
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#c0c0c0] p-[6px]">
        {children}
        {!session.playing && !result && <div className="absolute inset-0 flex items-center justify-center bg-[#c0c0c0]/70"><button className="win-button" onClick={session.resume}>Resume</button></div>}
      </div>
      {controls && (
        <fieldset disabled={!session.playing || Boolean(result)} className="game-touch-controls min-w-0 shrink-0 flex-wrap items-center justify-center gap-[4px] border-t border-[#808080] bg-[#c0c0c0] p-[4px]">
          {controls}
        </fieldset>
      )}
      <GameStatusBar>
        <span className="mr-3 shrink-0">Score: {score}</span>
        <span className="mr-3 shrink-0">Best: {best}</span>
        <span className="truncate" title={status}>{!session.playing && !result ? "Paused" : status ?? "Ready"}</span>
      </GameStatusBar>
      {result && <Win98Dialog title={title}>
        <p className="mb-4 text-center">{result}</p>
        <div className="flex justify-center gap-2">
          <button className="win-button" onClick={newGame}>New Game</button>
          <button className="win-button" onClick={onExit}>Exit</button>
        </div>
      </Win98Dialog>}
    </div>
  );
}

function TouchIcon({ label }: { label: string }) {
  const common = { stroke: "#000", strokeWidth: 2, fill: "none", strokeLinejoin: "miter" as const };
  if (label === "left") return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M9 2 L4 7 L9 12 Z" fill="#000" /></svg>;
  if (label === "up") return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 9 L7 4 L12 9 Z" fill="#000" /></svg>;
  if (label === "down") return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5 L7 10 L12 5 Z" fill="#000" /></svg>;
  if (label === "right") return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2 L10 7 L5 12 Z" fill="#000" /></svg>;
  if (label === "rotate") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M10.5 5.5 A4 4 0 1 0 11 9" {...common} />
        <path d="M10 2 L10.5 5.5 L7 5" fill="none" stroke="#000" strokeWidth="2" />
      </svg>
    );
  }
  return <span>{label}</span>;
}

export function TouchButton({ label, icon, onClick, wide }: { label: string; icon?: string; onClick: () => void; wide?: boolean }) {
  return (
    <button
      type="button"
      className={`win-button game-touch-button ${wide ? "min-w-[64px]" : "min-w-[44px]"} px-[8px] text-[13px] font-bold`}
      aria-label={label}
      title={label}
      onClick={(event) => { if (event.detail === 0) onClick(); }}
      onPointerDown={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {icon ? <TouchIcon label={icon} /> : label}
    </button>
  );
}
