"use client";

import { Solitaire } from "@/components/games/Solitaire";
import type { WindowComponentProps } from "@/lib/windows";

export function SolitaireWindow({ playSound, window: win, closeWindow }: WindowComponentProps) {
  return <Solitaire playSound={playSound} onExit={() => closeWindow(win.instanceId)} />;
}
