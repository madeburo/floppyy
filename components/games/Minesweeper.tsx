"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { GameMenuBar } from "./GameChrome";
import { FloppyyIcon } from "@/components/desktop/FloppyyIcon";
import { Win98ErrorDialog } from "@/components/windows/Win98ErrorDialog";
import { useWindowActivity } from "@/components/windows/WindowActivity";

const cellSize = 16;

type Difficulty = "beginner" | "intermediate" | "expert";
type Level = Difficulty | "custom";
type Config = { cols: number; rows: number; mines: number };

const PRESETS: Record<Difficulty, Config> = {
  beginner: { cols: 9, rows: 9, mines: 10 },
  intermediate: { cols: 16, rows: 16, mines: 40 },
  expert: { cols: 30, rows: 16, mines: 99 },
};

const emptyBest = (): Record<Difficulty, number | null> => ({
  beginner: null,
  intermediate: null,
  expert: null,
});

function readBestTimes(): Record<Difficulty, number | null> {
  try {
    const saved = globalThis.localStorage.getItem("floppyy-mines-best");
    if (!saved) return emptyBest();
    const parsed = JSON.parse(saved) as Partial<Record<Difficulty, number | null>>;
    return { ...emptyBest(), ...parsed };
  } catch {
    return emptyBest();
  }
}

function nowMs(): number {
  return Date.now();
}

function randomChance(chance: number): boolean {
  return Math.random() < chance;
}

type Face = "happy" | "pressed" | "lost" | "won";

function neighbors(index: number, cols: number, rows: number): number[] {
  const x = index % cols;
  const y = Math.floor(index / cols);
  const result: number[] = [];

  for (let yy = y - 1; yy <= y + 1; yy += 1) {
    for (let xx = x - 1; xx <= x + 1; xx += 1) {
      if (xx === x && yy === y) continue;
      if (xx >= 0 && xx < cols && yy >= 0 && yy < rows) result.push(yy * cols + xx);
    }
  }

  return result;
}

/** Place mines randomly, never on an excluded cell (first-click safety). */
function placeMines(exclude: Set<number>, cols: number, rows: number, mineCount: number): Set<number> {
  const total = cols * rows;
  const mines = new Set<number>();
  while (mines.size < mineCount) {
    const cell = Math.floor(Math.random() * total);
    if (!exclude.has(cell)) mines.add(cell);
  }
  return mines;
}

function computeCounts(mines: Set<number>, cols: number, rows: number): number[] {
  return Array.from({ length: cols * rows }, (_, index) =>
    neighbors(index, cols, rows).filter((neighbor) => mines.has(neighbor)).length,
  );
}

function revealEmpty(
  start: number,
  counts: number[],
  mines: Set<number>,
  current: Set<number>,
  cols: number,
  rows: number,
) {
  const next = new Set(current);
  const queue = [start];

  while (queue.length) {
    const cell = queue.shift()!;
    if (next.has(cell) || mines.has(cell)) continue;
    next.add(cell);

    if (counts[cell] === 0) {
      neighbors(cell, cols, rows).forEach((neighbor) => {
        if (!next.has(neighbor)) queue.push(neighbor);
      });
    }
  }

  return next;
}

function LedCounter({ value }: { value: number }) {
  const clamped = Math.max(-99, Math.min(999, value));
  const negative = clamped < 0;
  const digits = String(Math.abs(clamped)).padStart(negative ? 2 : 3, "0").split("");
  const cells = negative ? ["-", ...digits] : digits;
  return (
    <div className="flex h-[23px] w-[39px] bg-black">
      {cells.map((digit, index) => (
        <Image
          key={`${digit}-${index}`}
          src={`/game-assets/minesweeper/time${digit === "-" ? "-" : digit}.gif`}
          alt=""
          width={13}
          height={23}
          unoptimized
        />
      ))}
    </div>
  );
}

function FaceButton({ face, onClick }: { face: Face; onClick: () => void }) {
  const faceFile = face === "lost" ? "facedead" : face === "won" ? "facewin" : face === "pressed" ? "faceooh" : "facesmile";
  return (
    <button
      aria-label="Reset minesweeper"
      className="h-[26px] w-[26px] bg-[#c0c0c0] p-0"
      style={{ boxShadow: "inset -2px -2px #808080, inset 2px 2px #ffffff" }}
      onClick={onClick}
    >
      <Image src={`/game-assets/minesweeper/${faceFile}.gif`} alt="" width={26} height={26} unoptimized />
    </button>
  );
}

export function Minesweeper({ playSound, onExit }: { playSound: (name: string) => void; onExit?: () => void }) {
  const [level, setLevel] = useState<Level>("intermediate");
  const [customConfig, setCustomConfig] = useState<Config>({ cols: 16, rows: 16, mines: 40 });
  const [marks, setMarks] = useState(true);
  const [color, setColor] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showBestTimes, setShowBestTimes] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [bestTimes, setBestTimes] = useState<Record<Difficulty, number | null>>(readBestTimes);
  const [mines, setMines] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState<Set<number>>(new Set());
  const [lost, setLost] = useState(false);
  const [deathCell, setDeathCell] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const { active } = useWindowActivity();
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [face, setFace] = useState<Face>("happy");
  const [prankError, setPrankError] = useState(false);

  const { cols, rows, mines: totalMines } = level === "custom" ? customConfig : PRESETS[level];
  const totalCells = cols * rows;

  const counts = useMemo(() => computeCounts(mines, cols, rows), [mines, cols, rows]);
  const won = !lost && started && open.size >= totalCells - totalMines;
  const elapsed = Math.min(999, Math.floor((now - startedAt) / 1000));

  useEffect(() => {
    if (!started || lost || won || !active) return;
    const timer = window.setInterval(() => setNow((value) => value + 1000), 1000);
    return () => window.clearInterval(timer);
  }, [started, lost, won, active]);

  useEffect(() => {
    if (!won) return;
    playSound("notification");
    if (level === "custom") return; // custom games don't record best times
    const finalTime = Math.max(1, elapsed);
    const timer = window.setTimeout(() => {
      setBestTimes((prev) => {
        const current = prev[level];
        if (current !== null && current <= finalTime) return prev;
        const next = { ...prev, [level]: finalTime };
        try {
          globalThis.localStorage.setItem("floppyy-mines-best", JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [won, playSound, level, elapsed]);

  const reset = () => {
    const nextNow = nowMs();
    setMines(new Set());
    setOpen(new Set());
    setFlags(new Set());
    setQuestions(new Set());
    setLost(false);
    setDeathCell(null);
    setStarted(false);
    setStartedAt(nextNow);
    setNow(nextNow);
    setFace("happy");
    setPrankError(false);
    playSound("click");
  };

  const changeLevel = (next: Level) => {
    setLevel(next);
    const nextNow = nowMs();
    setMines(new Set());
    setOpen(new Set());
    setFlags(new Set());
    setQuestions(new Set());
    setLost(false);
    setDeathCell(null);
    setStarted(false);
    setStartedAt(nextNow);
    setNow(nextNow);
    setFace("happy");
    setPrankError(false);
    playSound("click");
  };

  const applyCustom = (cfg: Config) => {
    const clamped: Config = {
      rows: Math.max(8, Math.min(24, Math.round(cfg.rows) || 8)),
      cols: Math.max(8, Math.min(30, Math.round(cfg.cols) || 8)),
      mines: 0,
    };
    const maxMines = clamped.rows * clamped.cols - 1;
    clamped.mines = Math.max(1, Math.min(maxMines, Math.round(cfg.mines) || 1));
    setCustomConfig(clamped);
    setShowCustom(false);
    changeLevel("custom");
  };

  const loseWith = (death: number, mineSet: Set<number>) => {
    setMines(mineSet);
    setDeathCell(death);
    setLost(true);
    setFace("lost");
    playSound("error");
    // Easter egg: sometimes rub it in with a fake "data lost" error.
    if (randomChance(0.3)) {
      window.setTimeout(() => {
        playSound("error");
        setPrankError(true);
      }, 500);
    }
  };

  const openCell = (index: number) => {
    if (lost || won || flags.has(index) || questions.has(index)) return;

    // Chord: clicking a satisfied number opens its remaining neighbors
    if (open.has(index)) {
      const count = counts[index];
      if (count <= 0) return;
      const nbrs = neighbors(index, cols, rows);
      const flaggedCount = nbrs.filter((n) => flags.has(n)).length;
      if (flaggedCount !== count) return;

      const toReveal = nbrs.filter((n) => !flags.has(n) && !questions.has(n) && !open.has(n));
      const hitMine = toReveal.find((n) => mines.has(n));
      if (hitMine !== undefined) {
        loseWith(hitMine, mines);
        return;
      }
      let next = open;
      for (const n of toReveal) next = revealEmpty(n, counts, mines, next, cols, rows);
      if (next !== open) {
        setOpen(next);
        playSound("click");
      }
      return;
    }

    // First click: generate mines avoiding this cell and its neighbors
    let activeMines = mines;
    if (!started) {
      const exclude = new Set<number>([index, ...neighbors(index, cols, rows)]);
      activeMines = placeMines(exclude, cols, rows, totalMines);
      setMines(activeMines);
      setStarted(true);
      const t = nowMs();
      setStartedAt(t);
      setNow(t);
    }

    if (activeMines.has(index)) {
      loseWith(index, activeMines);
      return;
    }

    const activeCounts = computeCounts(activeMines, cols, rows);
    setOpen((current) => revealEmpty(index, activeCounts, activeMines, current, cols, rows));
    setFace("happy");
    playSound("click");
  };

  // Right click cycles: blank -> flag -> question -> blank
  const cycleMark = (index: number) => {
    if (lost || won || open.has(index)) return;
    if (flags.has(index)) {
      setFlags((s) => {
        const n = new Set(s);
        n.delete(index);
        return n;
      });
      if (marks) setQuestions((s) => new Set(s).add(index));
    } else if (questions.has(index)) {
      setQuestions((s) => {
        const n = new Set(s);
        n.delete(index);
        return n;
      });
    } else {
      setFlags((s) => new Set(s).add(index));
    }
    playSound("click");
  };

  const cellAsset = (index: number): string => {
    const mine = mines.has(index);
    const flagged = flags.has(index);
    const question = questions.has(index);

    if (lost) {
      if (index === deathCell) return "bombdeath";
      if (mine && flagged) return "bombflagged";
      if (mine) return "bombrevealed";
      if (flagged && !mine) return "bombmisflagged";
    }
    if (won && mine) return "bombflagged";
    if (flagged) return "bombflagged";
    if (question) return "bombquestion";
    if (open.has(index)) return `open${counts[index]}`;
    return "blank";
  };

  return (
    <div className="relative inline-flex flex-col bg-[#c0c0c0] text-[11px]">
      <GameMenuBar
        items={[
          {
            label: "Game",
            menu: [
              { label: "New", shortcut: "F2", onClick: reset },
              { label: "Beginner", separatorBefore: true, checked: level === "beginner", onClick: () => changeLevel("beginner") },
              { label: "Intermediate", checked: level === "intermediate", onClick: () => changeLevel("intermediate") },
              { label: "Expert", checked: level === "expert", onClick: () => changeLevel("expert") },
              { label: "Custom...", checked: level === "custom", onClick: () => setShowCustom(true) },
              { label: "Marks (?)", separatorBefore: true, checked: marks, onClick: () => { setMarks((m) => !m); playSound("click"); } },
              { label: "Color", checked: color, onClick: () => { setColor((c) => !c); playSound("click"); } },
              { label: "Best Times...", separatorBefore: true, onClick: () => { setShowBestTimes(true); playSound("click"); } },
              { label: "Exit", separatorBefore: true, onClick: () => (onExit ? onExit() : undefined) },
            ],
          },
          {
            label: "Help",
            menu: [
              { label: "Help Topics", onClick: () => playSound("click") },
              { label: "About Minesweeper", separatorBefore: true, onClick: () => { setShowAbout(true); playSound("click"); } },
            ],
          },
        ]}
      />

      <div
        className="bg-[#c0c0c0] p-[6px]"
        style={{
          boxShadow: "inset -2px -2px #808080, inset 2px 2px #ffffff, inset -3px -3px #404040, inset 3px 3px #dfdfdf",
        }}
      >
        <div
          className="mb-[6px] flex h-[37px] items-center justify-between bg-[#c0c0c0] px-[7px]"
          style={{
            boxShadow: "inset 2px 2px #808080, inset -2px -2px #ffffff",
          }}
        >
          <LedCounter value={totalMines - flags.size} />
          <FaceButton face={won ? "won" : face} onClick={reset} />
          <LedCounter value={elapsed} />
        </div>

        <div
          className="grid bg-[#808080]"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            boxShadow: "inset 2px 2px #808080, inset -2px -2px #ffffff",
            padding: 3,
          }}
        >
          {Array.from({ length: totalCells }, (_, index) => {
            const opened = open.has(index);
            const flagged = flags.has(index);
            const question = questions.has(index);
            return (
              <button
                key={index}
                aria-label={`Cell ${index}`}
                className="block p-0"
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundImage: `url('/game-assets/minesweeper/${cellAsset(index)}.gif')`,
                  backgroundSize: "16px 16px",
                  imageRendering: "pixelated",
                }}
                onMouseDown={(event) => {
                  if (event.button === 0 && !opened && !flagged && !question && !lost && !won) setFace("pressed");
                }}
                onMouseUp={() => {
                  if (!lost && !won) setFace("happy");
                }}
                onMouseLeave={() => {
                  if (!lost && !won && face === "pressed") setFace("happy");
                }}
                onClick={() => openCell(index)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  cycleMark(index);
                }}
              />
            );
          })}
        </div>
      </div>

      {prankError && (
        <Win98ErrorDialog
          title="Minesweeper"
          message="Your progress has been lost. Forever."
          onClose={() => setPrankError(false)}
        />
      )}

      {showAbout && <AboutMinesweeperDialog onClose={() => setShowAbout(false)} />}
      {showBestTimes && (
        <BestTimesDialog
          bestTimes={bestTimes}
          onReset={() => {
            const cleared = emptyBest();
            setBestTimes(cleared);
            try {
              globalThis.localStorage.setItem("floppyy-mines-best", JSON.stringify(cleared));
            } catch {
              /* ignore */
            }
            playSound("click");
          }}
          onClose={() => setShowBestTimes(false)}
        />
      )}
      {showCustom && (
        <CustomFieldDialog
          initial={level === "custom" ? customConfig : PRESETS.intermediate}
          onCancel={() => setShowCustom(false)}
          onApply={applyCustom}
        />
      )}
    </div>
  );
}

/** Shared Windows 98 dialog frame used by the Minesweeper pop-ups. */
function MsDialog({
  title,
  width = 340,
  onClose,
  children,
}: {
  title: string;
  width?: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 z-[9000] flex items-center justify-center bg-black/20"
      onPointerDown={onClose}
    >
      <div
        className="select-none bg-[#c0c0c0] text-black"
        style={{
          width,
          boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
          padding: 3,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="flex h-[18px] items-center justify-between bg-gradient-to-r from-[#000080] to-[#1084d0] pl-[4px] pr-[2px]">
          <span className="truncate text-[11px] font-bold text-white">{title}</span>
          <button
            className="flex h-[14px] w-[16px] items-center justify-center text-[10px] leading-none text-black"
            style={{ background: "#c0c0c0", boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf" }}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AboutMinesweeperDialog({ onClose }: { onClose: () => void }) {
  return (
    <MsDialog title="About Minesweeper" width={360} onClose={onClose}>
      <div className="flex gap-[14px] px-[14px] pb-[10px] pt-[16px]">
        <FloppyyIcon type="gears" size={40} />
        <div className="text-[11px] leading-[16px]">
          <div>(R) Minesweeper</div>
          <div>Windows 98</div>
          <div>Copyright (C) 1981-1998 Microsoft Corp.</div>
          <div>by Robert Donner and Curt Johnson</div>
        </div>
      </div>
      <div className="mx-[14px] my-[6px] h-px bg-[#808080] shadow-[0_1px_#fff]" />
      <div className="px-[14px] pb-[14px] text-[11px] leading-[18px]">
        <div className="flex justify-between gap-[20px]">
          <span>Physical memory available to Windows:</span>
          <span>130,588 KB</span>
        </div>
        <div className="flex justify-between gap-[20px]">
          <span>System resources:</span>
          <span>97% Free</span>
        </div>
      </div>
      <div className="flex justify-end px-[14px] pb-[14px]">
        <button className="win-button min-w-[80px] text-[11px]" onClick={onClose} autoFocus>
          OK
        </button>
      </div>
    </MsDialog>
  );
}

function BestTimesDialog({
  bestTimes,
  onReset,
  onClose,
}: {
  bestTimes: Record<Difficulty, number | null>;
  onReset: () => void;
  onClose: () => void;
}) {
  const rows: Array<[Difficulty, string]> = [
    ["beginner", "Beginner"],
    ["intermediate", "Intermediate"],
    ["expert", "Expert"],
  ];
  return (
    <MsDialog title="Fastest Mine Sweepers" width={280} onClose={onClose}>
      <div className="px-[16px] py-[14px] text-[11px]">
        {rows.map(([key, label]) => (
          <div key={key} className="flex justify-between gap-[16px] leading-[20px]">
            <span>{label}:</span>
            <span className="tabular-nums">
              {bestTimes[key] !== null ? `${bestTimes[key]} seconds` : "999 seconds"}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-[8px] px-[16px] pb-[14px]">
        <button className="win-button min-w-[92px] text-[11px]" onClick={onReset}>
          Reset Scores
        </button>
        <button className="win-button min-w-[72px] text-[11px]" onClick={onClose} autoFocus>
          OK
        </button>
      </div>
    </MsDialog>
  );
}

function CustomFieldDialog({
  initial,
  onCancel,
  onApply,
}: {
  initial: Config;
  onCancel: () => void;
  onApply: (cfg: Config) => void;
}) {
  const [height, setHeight] = useState(String(initial.rows));
  const [width, setWidth] = useState(String(initial.cols));
  const [mines, setMines] = useState(String(initial.mines));

  const field = (label: string, value: string, setValue: (v: string) => void) => (
    <label className="flex items-center justify-between gap-[10px] leading-[22px]">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-[56px] bg-white px-[4px] text-[11px]"
        style={{ boxShadow: "inset 1px 1px #808080, inset -1px -1px #ffffff" }}
      />
    </label>
  );

  return (
    <MsDialog title="Custom Field" width={240} onClose={onCancel}>
      <div className="px-[16px] py-[14px] text-[11px]">
        {field("Height:", height, setHeight)}
        {field("Width:", width, setWidth)}
        {field("Mines:", mines, setMines)}
      </div>
      <div className="flex justify-end gap-[8px] px-[16px] pb-[14px]">
        <button
          className="win-button min-w-[64px] text-[11px]"
          onClick={() => onApply({ rows: Number(height), cols: Number(width), mines: Number(mines) })}
          autoFocus
        >
          OK
        </button>
        <button className="win-button min-w-[64px] text-[11px]" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </MsDialog>
  );
}
