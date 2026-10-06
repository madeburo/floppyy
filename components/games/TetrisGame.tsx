"use client";

import { useCallback, useEffect, useState } from "react";
import { Shell, TouchButton, useHighScore, useTick, useGameSession, useGameKeys, cellInset, cellOutset, type GameProps } from "./RetroGameShell";
import { rotate, randomTetrisShape, type Point } from "@/lib/games/tetris";

export function TetrisGame({ playSound, onExit }: GameProps) {
  const session = useGameSession();
  const [best, record] = useHighScore("floppyy-tetris-best");
  const [board, setBoard] = useState<number[][]>(() => Array.from({ length: 18 }, () => Array(10).fill(0)));
  const [shape, setShape] = useState<Point[]>(randomTetrisShape);
  const [pos, setPos] = useState<Point>([5, 0]);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);

  const reset = useCallback(() => {
    setBoard(Array.from({ length: 18 }, () => Array(10).fill(0)));
    setShape(randomTetrisShape());
    setPos([5, 0]);
    setScore(0);
    setRunning(true);
    playSound("click");
  }, [playSound]);

  const collides = useCallback((nextShape: Point[], nextPos: Point, nextBoard = board) => (
    nextShape.some(([x, y]) => {
      const px = nextPos[0] + x;
      const py = nextPos[1] + y;
      return px < 0 || px >= 10 || py >= 18 || (py >= 0 && nextBoard[py][px]);
    })
  ), [board]);

  const lock = useCallback(() => {
      const next = board.map((row) => [...row]);
      shape.forEach(([x, y]) => {
        const px = pos[0] + x;
        const py = pos[1] + y;
        if (py >= 0 && py < 18 && px >= 0 && px < 10) next[py][px] = 1;
      });
      const kept = next.filter((row) => row.some((cell) => !cell));
      const cleared = 18 - kept.length;
      if (cleared) {
        setScore((value) => value + cleared * 100);
        playSound("click");
      }
      const nextBoard = [...Array.from({ length: cleared }, () => Array(10).fill(0)), ...kept];
      setBoard(nextBoard);
    const nextShape = randomTetrisShape();
    setShape(nextShape);
    setPos([5, 0]);
    if (shape.some(([, y]) => pos[1] + y < 0) || collides(nextShape, [5, 0], nextBoard)) {
      setRunning(false);
      record(score);
      playSound("error");
    }
  }, [board, collides, playSound, pos, record, score, shape]);

  const drop = useCallback(() => {
    const next: Point = [pos[0], pos[1] + 1];
    if (collides(shape, next)) lock();
    else setPos(next);
  }, [collides, lock, pos, shape]);

  const moveSide = useCallback((delta: number) => {
    if (!running) return;
    const next: Point = [pos[0] + delta, pos[1]];
    if (!collides(shape, next)) setPos(next);
  }, [collides, pos, running, shape]);

  const rotateActive = useCallback(() => {
    if (!running) return;
    const nextShape = rotate(shape);
    if (!collides(nextShape, pos)) setShape(nextShape);
  }, [collides, pos, running, shape]);

  useTick(running && session.playing, 520, drop);
  useEffect(() => record(score), [score, record]);

  useGameKeys(session.playing && running, { ArrowLeft: () => moveSide(-1), ArrowRight: () => moveSide(1), ArrowDown: drop, ArrowUp: rotateActive });

  const active = new Set(shape.map(([x, y]) => `${pos[0] + x}:${pos[1] + y}`));
  return (
    <Shell
      title="Tetris"
      session={session}
      result={!running ? "Game over. Start a new game?" : undefined}
      score={score}
      best={best}
      onExit={onExit}
      onReset={reset}
      status="Move blocks, rotate, and drop."
      controls={
        <>
          <TouchButton label="Left" icon="left" onClick={() => moveSide(-1)} />
          <TouchButton label="Rotate" icon="rotate" onClick={rotateActive} />
          <TouchButton label="Right" icon="right" onClick={() => moveSide(1)} />
          <TouchButton label="Drop" icon="down" onClick={drop} />
        </>
      }
    >
      <div className="grid bg-[#808080] p-[3px]" style={{ gridTemplateColumns: "repeat(10, 18px)", boxShadow: cellInset }}>
        {board.flatMap((row, y) => row.map((cell, x) => (
          <div key={`${x}:${y}`} className="h-[18px] w-[18px]" style={{ background: cell || active.has(`${x}:${y}`) ? "#0000aa" : "#000", boxShadow: cell || active.has(`${x}:${y}`) ? cellOutset : "none" }} />
        )))}
      </div>
    </Shell>
  );
}
