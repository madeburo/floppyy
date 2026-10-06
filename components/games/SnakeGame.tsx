"use client";

import { useCallback, useEffect, useState } from "react";
import { Shell, TouchButton, useHighScore, useTick, useGameSession, useGameKeys, cellInset, type GameProps } from "./RetroGameShell";

export function SnakeGame({ playSound, onExit }: GameProps) {
  const session = useGameSession();
  const [best, record] = useHighScore("floppyy-snake-best");
  const [snake, setSnake] = useState([[8, 6], [7, 6], [6, 6]]);
  const [dir, setDir] = useState<[number, number]>([1, 0]);
  const [food, setFood] = useState([12, 6]);
  const [running, setRunning] = useState(true);
  const score = Math.max(0, snake.length - 3) * 10;

  const reset = useCallback(() => {
    setSnake([[8, 6], [7, 6], [6, 6]]);
    setDir([1, 0]);
    setFood([12, 6]);
    setRunning(true);
    playSound("click");
  }, [playSound]);

  const setSnakeDirection = useCallback((nextDir: [number, number]) => {
    setDir((current) => (current[0] + nextDir[0] === 0 && current[1] + nextDir[1] === 0 ? current : nextDir));
  }, []);

  useGameKeys(session.playing && running, {
    ArrowUp: () => setSnakeDirection([0, -1]), ArrowDown: () => setSnakeDirection([0, 1]),
    ArrowLeft: () => setSnakeDirection([-1, 0]), ArrowRight: () => setSnakeDirection([1, 0]),
  });
  useEffect(() => record(score), [score, record]);

  useTick(running && session.playing, 120, () => {
      const current = snake;
      const head = current[0];
      const next = [(head[0] + dir[0] + 16) % 16, (head[1] + dir[1] + 12) % 12];
      const ate = next[0] === food[0] && next[1] === food[1];
      const body = ate ? current : current.slice(0, -1);
      if (body.some(([x, y]) => x === next[0] && y === next[1])) {
        setRunning(false);
        record(score);
        playSound("error");
        return;
      }
      if (ate) {
        const occupied = new Set([next, ...current].map(([x, y]) => y * 16 + x));
        const free = Array.from({ length: 192 }, (_, index) => index).filter(index => !occupied.has(index));
        if (free.length) {
          const index = free[Math.floor(Math.random() * free.length)];
          setFood([index % 16, Math.floor(index / 16)]);
        } else setRunning(false);
        playSound("click");
      }
      setSnake([next, ...current].slice(0, ate ? current.length + 1 : current.length));
  });

  return (
    <Shell
      title="Snake"
      session={session}
      result={!running ? snake.length === 192 ? "You won! Start a new game?" : "Game over. Start a new game?" : undefined}
      score={score}
      best={best}
      onExit={onExit}
      onReset={reset}
      status={running ? "Arrow keys or buttons move the snake." : "Game over. Press Game > New."}
      controls={
        <>
          <TouchButton label="Left" icon="left" onClick={() => setSnakeDirection([-1, 0])} />
          <TouchButton label="Up" icon="up" onClick={() => setSnakeDirection([0, -1])} />
          <TouchButton label="Down" icon="down" onClick={() => setSnakeDirection([0, 1])} />
          <TouchButton label="Right" icon="right" onClick={() => setSnakeDirection([1, 0])} />
        </>
      }
    >
      <div className="grid bg-[#808080] p-[3px]" style={{ gridTemplateColumns: "repeat(16, 16px)", boxShadow: cellInset }}>
        {Array.from({ length: 192 }).map((_, index) => {
          const x = index % 16;
          const y = Math.floor(index / 16);
          const isSnake = snake.some(([sx, sy]) => sx === x && sy === y);
          const isFood = food[0] === x && food[1] === y;
          return <div key={index} className="h-[16px] w-[16px] border border-[#c0c0c0]" style={{ background: isSnake ? "#008000" : isFood ? "#ff0000" : "#000" }} />;
        })}
      </div>
    </Shell>
  );
}
