export function solitaireLayout(width: number) {
  const gap = width < 560 ? 3 : 8;
  const padding = width < 560 ? 6 : 16;
  const baseWidth = 7 * 71 + 6 * gap + 2 * padding;
  return { gap, padding, baseWidth, scale: Math.min(1, Math.max(1, width) / baseWidth) };
}
