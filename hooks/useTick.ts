"use client";

import { useEffect, useEffectEvent } from "react";

export function useTick(enabled: boolean, delay: number, callback: () => void) {
  const tick = useEffectEvent(callback);
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => tick(), delay);
    return () => window.clearInterval(id);
  }, [delay, enabled]);
}
