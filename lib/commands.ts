import type { WindowId } from "./windows";

export const commands: Record<string, WindowId> = {
  about: "about",
  projects: "projects",
  games: "games",
  music: "music",
  winamp: "music",
  screensaver: "screensaver",
  defrag: "defrag",
  calculator: "calculator",
  calc: "calculator",
  msdos: "msdos",
  cmd: "msdos",
  paint: "paint",
  notepad: "notepad",
  computer: "computer",
  control: "control-panel",
  "control panel": "control-panel",
  ie: "ie-browser",
  iexplore: "ie-browser",
  explorer: "ie-browser",
  netscape: "netscape",
  doom: "doom",
  minesweeper: "minesweeper",
  mine: "minesweeper",
  solitaire: "solitaire",
  contact: "outlook",
  outlook: "outlook",
  mail: "outlook",
  guestbook: "guestbook",
  irc: "guestbook",
  help: "help",
};

export function isUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("www.") ||
    /^[a-z0-9-]+\.(com|net|org|io|gov|edu|co|uk|de|fr|ru|jp)(\/.*)?$/.test(v)
  );
}
