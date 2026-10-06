import type { WindowId } from "./windows";

export type GameEntry = {
  id: WindowId;
  label: string;
  icon: string;
  description: string;
};

// Every Floppyy game lives here. Icons resolve from /public/icons/<icon>.png
// with an SVG fallback, so new PNGs can be dropped in later.
export const GAME_REGISTRY: GameEntry[] = [
  { id: "minesweeper", label: "Minesweeper.exe", icon: "mine", description: "Classic mine-clearing puzzle" },
  { id: "solitaire", label: "Solitaire.exe", icon: "cards", description: "Klondike solitaire card game" },
  { id: "doom", label: "DOOM.exe", icon: "doom", description: "id Software's legendary FPS" },
  { id: "duke3d", label: "Duke Nukem 3D.exe", icon: "duke3d", description: "Come get some. 3D Realms FPS" },
  { id: "wolf3d", label: "Wolfenstein 3D.exe", icon: "wolfenstein", description: "The original first-person shooter" },
  { id: "dune2", label: "Dune II.exe", icon: "dune2", description: "The real-time strategy pioneer" },
  { id: "warcraft", label: "WarCraft.exe", icon: "warcraft", description: "Blizzard's first RTS" },
  { id: "snake", label: "Snake.exe", icon: "snake", description: "Retro grid snake with local high score" },
  { id: "tetris", label: "Tetris.exe", icon: "tetris", description: "Falling blocks, rows, and old keyboard reflexes" },
  { id: "breakout", label: "Breakout.exe", icon: "breakout", description: "Break every brick before the ball escapes" },
  { id: "pixel-puzzle", label: "Pixel Puzzle.exe", icon: "pixelpuzzle", description: "Slide the tiles back into order" },
  { id: "typing-game", label: "Typing Tutor.exe", icon: "typingtutor", description: "Type the retro words before the clock runs out" },
  { id: "checkers", label: "Checkers.exe", icon: "checkers", description: "Checkers against the computer" },
];
