"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ScreensaverMode = "pipes" | "stars" | "maze" | "mystify" | "flying-windows";

function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem("floppyy-screensaver") ?? "{}");
    const mode: ScreensaverMode = ["pipes", "stars", "maze", "mystify", "flying-windows"].includes(value.mode) ? value.mode : "flying-windows";
    return { mode, wait: Number.isFinite(value.wait) ? Math.min(60, Math.max(1, value.wait)) : 1 };
  } catch { return { mode: "flying-windows" as ScreensaverMode, wait: 1 }; }
}

export function useScreensaver(suspended = false) {
  const [active, setActive] = useState(false);
  const [defaultMode, setDefaultMode] = useState<ScreensaverMode>(() => readPreferences().mode);
  const [mode, setMode] = useState<ScreensaverMode>(defaultMode);
  const [waitMinutes, setWaitMinutes] = useState(() => readPreferences().wait);
  const timeoutMs = waitMinutes * 60000;
  const timer = useRef<number | null>(null);
  const activatedAt = useRef(0);
  useEffect(() => {
    try { localStorage.setItem("floppyy-screensaver", JSON.stringify({ mode: defaultMode, wait: waitMinutes })); } catch { /* ignore */ }
  }, [defaultMode, waitMinutes]);

  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const schedule = useCallback(() => {
    clear();
    timer.current = window.setTimeout(() => {
      activatedAt.current = performance.now();
      setMode(defaultMode);
      setActive(true);
    }, timeoutMs);
  }, [clear, defaultMode, timeoutMs]);

  const start = useCallback((nextMode: ScreensaverMode = "flying-windows") => {
    activatedAt.current = performance.now();
    setMode(nextMode);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    schedule();
  }, [schedule]);

  useEffect(() => {
    if (suspended) {
      clear();
      const idle = window.setTimeout(() => setActive(false), 0);
      return () => window.clearTimeout(idle);
    }

    schedule();
    const activity = () => {
      if (active && performance.now() - activatedAt.current > 500) {
        setActive(false);
      }
      schedule();
    };
    window.addEventListener("pointermove", activity);
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    return () => {
      clear();
      window.removeEventListener("pointermove", activity);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
    };
  }, [active, clear, schedule, suspended]);

  return { active, mode, start, stop, defaultMode, setMode: setDefaultMode, waitMinutes, setWaitMinutes };
}
