"use client";

import { useEffect, useState } from "react";
import { Shell, useHighScore, useGameSession, cellInset, cellOutset, type GameProps } from "./RetroGameShell";

export function PixelPuzzleGame({ playSound, onExit }: GameProps) {
  const session = useGameSession();
  const [best, record] = useHighScore("floppyy-pixel-puzzle-best");
  const [tiles, setTiles] = useState(() => [1, 5, 2, 4, 9, 6, 3, 8, 13, 10, 7, 12, 14, 11, 15, 0]);
  const [moves, setMoves] = useState(0);
  const solved = tiles.every((tile, index) => tile === (index === 15 ? 0 : index + 1));
  useEffect(() => { if (solved && moves > 0) record(Math.max(1, 1000 - moves)); }, [moves, record, solved]);
  const reset = () => { setTiles([1, 5, 2, 4, 9, 6, 3, 8, 13, 10, 7, 12, 14, 11, 15, 0]); setMoves(0); playSound("click"); };
  const move = (index: number) => {
    const empty = tiles.indexOf(0);
    const ok = Math.abs((index % 4) - (empty % 4)) + Math.abs(Math.floor(index / 4) - Math.floor(empty / 4)) === 1;
    if (!ok) return;
    setTiles((current) => current.map((tile, i) => (i === empty ? current[index] : i === index ? 0 : tile)));
    setMoves((value) => value + 1);
    playSound("click");
  };
  return (
    <Shell title="Pixel Puzzle" session={session} result={solved ? "Puzzle solved! Start a new game?" : undefined} score={Math.max(0, 1000 - moves)} best={best} onExit={onExit} onReset={reset} status={solved ? "Solved!" : "Tap a tile next to the black square."}>
      <div className="grid grid-cols-4 gap-[3px] bg-[#808080] p-[4px]" style={{ boxShadow: cellInset }}>
        {tiles.map((tile, index) => (
          <button key={index} className="h-[58px] w-[58px] text-[18px] font-bold" style={{ background: tile ? "#c0c0c0" : "#000", boxShadow: tile ? cellOutset : cellInset }} onClick={() => move(index)}>
            {tile ? <span style={{ color: tile % 3 === 0 ? "#000080" : tile % 3 === 1 ? "#008080" : "#800000" }}>{tile}</span> : ""}
          </button>
        ))}
      </div>
    </Shell>
  );
}
