import type { DesktopWindow, WindowDefinition } from "./windows";

export type Viewport = { width: number; height: number; left?: number; top?: number };

export function fitWindow<T extends Pick<DesktopWindow, "x" | "y" | "width" | "height">>(win: T, viewport: Viewport): T {
  const left = (viewport.left ?? 0) + 8;
  const top = (viewport.top ?? 0) + 8;
  const width = Math.max(1, Math.min(win.width, viewport.width - 16));
  const height = Math.max(1, Math.min(win.height, viewport.height - 44));
  return {
    ...win, width, height,
    x: Math.max(left, Math.min(win.x, left + viewport.width - width - 16)),
    y: Math.max(top, Math.min(win.y, top + viewport.height - height - 44)),
  };
}

export function initialWindowSize(definition: WindowDefinition, viewport: Viewport) {
  const mobile = viewport.width < 640;
  const touchControls = mobile && ["snake", "tetris", "breakout", "pixel-puzzle", "typing-game", "checkers"].includes(definition.id);
  return fitWindow({
    x: 8, y: 8,
    width: mobile && !definition.noMaximize ? viewport.width - 16 : definition.width,
    height: mobile ? Math.min(definition.height + (touchControls ? 64 : 0), viewport.height * (definition.id === "solitaire" ? 0.8 : 0.9)) : definition.height,
  }, viewport);
}
