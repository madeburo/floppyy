"use client";

import { useEffect, useRef, useState } from "react";
import { Shell, TouchButton, useHighScore, useTick, useGameSession, cellInset, type GameProps } from "./RetroGameShell";

const WORDS = [
  "apple", "beach", "coffee", "window", "rocket", "garden", "summer", "camera", "orange", "wizard",
  "planet", "magnet", "castle", "button", "memory", "school", "secret", "cookie", "printer", "modem",
  "floppy", "guestbook", "winamp", "desktop", "pixel", "archive", "dialup", "folder", "share", "browser",
  "keyboard", "notepad", "network", "compact", "scanner", "mailbox", "download", "internet", "console", "startup",
];

function randomWord(except?: string) {
  const choices = except ? WORDS.filter((item) => item !== except) : WORDS;
  return choices[Math.floor(Math.random() * choices.length)] ?? WORDS[0];
}

export function TypingGame({ playSound, onExit }: GameProps) {
  const session = useGameSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [best, record] = useHighScore("floppyy-typing-best");
  const [word, setWord] = useState(() => randomWord());
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(45);
  const running = time > 0;
  const reset = () => { setWord(randomWord(word)); setInput(""); setScore(0); setTime(45); playSound("click"); };
  const remaining = useRef(45_000);
  const lastTick = useRef<number | null>(null);
  useEffect(() => { lastTick.current = session.playing && running ? performance.now() : null; }, [session.playing, running]);
  useTick(running && session.playing, 100, () => {
    const now = performance.now();
    if (lastTick.current !== null) remaining.current = Math.max(0, remaining.current - (now - lastTick.current));
    lastTick.current = now;
    setTime(Math.ceil(remaining.current / 1000));
  });
  useEffect(() => record(score), [record, score]);
  return (
    <Shell
      title="Typing"
      session={session}
      result={!running ? "Time is up. Start a new game?" : undefined}
      score={score}
      best={best}
      onExit={onExit}
      onReset={() => { remaining.current = 45_000; lastTick.current = performance.now(); reset(); }}
      status={`Time: ${time}s`}
      controls={<TouchButton label="Type" wide onClick={() => inputRef.current?.focus()} />}
    >
      <div className="w-full max-w-[360px] bg-[#c0c0c0] p-[12px]" style={{ boxShadow: cellInset }}>
        <div className="mb-[12px] bg-black px-[10px] py-[12px] text-center text-[24px] font-bold text-[#00ff00]">{word}</div>
        <input
          className="win-bevel-inset h-[28px] w-full bg-white px-[6px] text-[14px]"
          value={input}
          ref={inputRef}
          disabled={!running}
          aria-label="Type the word"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
          onChange={(event) => {
            if (!session.playing || !running) return;
            const value = event.target.value;
            if (value.trim().toLowerCase() === word) {
              setScore((current) => current + word.length * 10);
              setInput("");
              setWord((current) => randomWord(current));
              playSound("click");
            } else {
              setInput(value);
            }
          }}
        />
      </div>
    </Shell>
  );
}
