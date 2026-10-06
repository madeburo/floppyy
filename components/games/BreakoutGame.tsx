"use client";

import { useCallback, useEffect, useState } from "react";
import { Shell, TouchButton, useHighScore, useTick, useGameSession, useGameKeys, cellInset, cellOutset, type GameProps } from "./RetroGameShell";

export function BreakoutGame({ playSound, onExit, windowWidth }: GameProps) {
  const session = useGameSession();
  const newBall = () => {
    const horizontal = (Math.random() < 0.5 ? -1 : 1) * (1.1 + Math.random() * 0.8);
    return { x: 50, y: 70, vx: horizontal, vy: -(1.2 + Math.random() * 0.6) };
  };
  const [best, record] = useHighScore("floppyy-breakout-best");
  const [bricks, setBricks] = useState(() => Array.from({ length: 40 }, () => true));
  const [paddle, setPaddle] = useState(40);
  const [ball, setBall] = useState(newBall);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);
  const [lost, setLost] = useState(false);
  const reset = () => { setBricks(Array.from({ length: 40 }, () => true)); setBall(newBall()); setPaddle(40); setScore(0); setRunning(true); setLost(false); playSound("click"); };
  const movePaddle = useCallback((delta: number) => {
    setPaddle((value) => Math.max(0, Math.min(80, value + delta)));
  }, []);

  useGameKeys(session.playing && running, { ArrowLeft: () => movePaddle(-7), ArrowRight: () => movePaddle(7) });
  useEffect(() => record(score), [score, record]);

  useTick(running && session.playing, 24, () => {
      const b = ball;
      const next = { ...b, x: b.x + b.vx, y: b.y + b.vy };
      if (next.x <= 0 || next.x >= 97) next.vx *= -1;
      if (next.y <= 0) next.vy *= -1;
      if (b.vy > 0 && b.y < 87 && next.y >= 87 && next.x + 3 >= paddle && next.x <= paddle + 20) next.vy = -Math.abs(next.vy);
      if (next.y >= 99) {
        setRunning(false);
        setLost(true);
        record(score);
        playSound("error");
        setBall({ ...next, y: 96, vx: 0, vy: 0 });
        return;
      }
      const col = Math.floor(next.x / 12.5);
      const row = Math.floor((next.y - 8) / 7);
      const index = row * 8 + col;
      if (row >= 0 && row < 5 && bricks[index]) {
        setBricks((current) => current.map((item, i) => (i === index ? false : item)));
        setScore((value) => value + 10);
        next.vy *= -1;
        playSound("click");
      }
      if (bricks.every((brick) => !brick)) {
        setRunning(false);
        record(score);
      }
      setBall(next);
  });

  const scale = windowWidth && windowWidth < 360 ? Math.max(0.78, Math.min(1, (windowWidth - 28) / 334)) : 1;

  return (
    <Shell
      title="Breakout"
      session={session}
      result={!running ? lost ? "Game over. Start a new game?" : "You won! Start a new game?" : undefined}
      score={score}
      best={best}
      onExit={onExit}
      onReset={reset}
      status={lost ? "Game over. Press Game > New." : "Break every brick."}
      controls={
        <div className="flex w-full justify-between px-[10px]">
          <TouchButton label="Left" icon="left" wide onClick={() => movePaddle(-9)} />
          <TouchButton label="Right" icon="right" wide onClick={() => movePaddle(9)} />
        </div>
      }
    >
      <div style={scale < 1 ? { width: 322 * scale, height: 220 * scale } : undefined}>
        <div
          className="relative h-[220px] w-[322px] overflow-hidden bg-black"
          style={{
            boxShadow: cellInset,
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
          }}
        >
          <div className="absolute left-[12px] top-[12px] grid grid-cols-8 gap-[2px]">
            {bricks.map((brick, index) => <div key={index} className="h-[11px] w-[34px]" style={{ background: brick ? ["#ff0000", "#ffff00", "#00aa00", "#00aaff", "#ff00ff"][Math.floor(index / 8)] : "transparent", boxShadow: brick ? cellOutset : "none" }} />)}
          </div>
          <div className="absolute h-[9px] w-[9px] bg-white" style={{ left: `${ball.x}%`, top: `${ball.y}%` }} />
          <div className="absolute bottom-[16px] h-[9px] w-[20%] bg-[#c0c0c0]" style={{ left: `${paddle}%`, boxShadow: cellOutset }} />
        </div>
      </div>
    </Shell>
  );
}
