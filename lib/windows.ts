import type { ReactNode } from "react";

export type WindowId =
  | "about"
  | "calculator"
  | "computer"
  | "control-panel"
  | "datetime"
  | "defrag"
  | "help"
  | "documents"
  | "doom"
  | "duke3d"
  | "wolf3d"
  | "dune2"
  | "warcraft"
  | "drive"
  | "guestbook"
  | "internet"
  | "ie-browser"
  | "netscape"
  | "mediaplayer"
  | "minesweeper"
  | "msdos"
  | "notepad"
  | "outlook"
  | "projects"
  | "profile"
  | "games"
  | "games-folder"
  | "music"
  | "norton"
  | "paint"
  | "recycle-bin"
  | "screensaver"
  | "solitaire"
  | "snake"
  | "tetris"
  | "breakout"
  | "pixel-puzzle"
  | "typing-game"
  | "checkers"
  | "run"
  | "settings"
  | "share"
  | "project-details";

export type DesktopWindow = {
  instanceId: string;
  id: WindowId;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  payload?: string;
};

export type WindowDefinition = {
  id: WindowId;
  title: string;
  icon: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  ephemeral?: boolean;
  dialog?: boolean;
  noMaximize?: boolean;
};

export type WindowComponentProps = {
  window: DesktopWindow;
  active?: boolean;
  registerCloseGuard?: (instanceId: string, guard: (proceed: () => void) => void) => () => void;
  openWindow: (id: WindowId, payload?: string) => void;
  closeWindow: (instanceId: string) => void;
  minimizeWindow?: (instanceId: string) => void;
  resizeWindow?: (instanceId: string, width: number, height: number) => void;
  notify: (message: string, options?: { icon?: string; titleIcon?: string; persistent?: boolean; balloon?: boolean }) => void;
  playSound: (sound: string) => void;
  warmSound?: (sound: string) => void;
  fadeOutSound?: (sound: string, duration?: number) => void;
  startScreensaver: (mode?: "pipes" | "stars" | "maze" | "mystify" | "flying-windows") => void;
  setDefaultScreensaver?: (mode: "pipes" | "stars" | "maze" | "mystify" | "flying-windows") => void;
  screensaverMode?: "pipes" | "stars" | "maze" | "mystify" | "flying-windows";
  screensaverWait?: number;
  setScreensaverWait?: (minutes: number) => void;
  resetDesktopLayout?: () => void;
  crashSystem?: (options?: { variant?: "cascade" | "fatal"; message?: string }) => void;
  wallpaper?: string;
  setWallpaper?: (id: string) => void;
  internetConnected?: boolean;
  muted?: boolean;
};

export const windowDefinitions: Record<WindowId, WindowDefinition> = {
  about: { id: "about", title: "Welcome to Floppyy", icon: "computer", width: 560, height: 500 },
  calculator: { id: "calculator", title: "Calculator", icon: "calculator", width: 260, height: 270 },
  computer: { id: "computer", title: "My Computer", icon: "computer", width: 740, height: 520 },
  "control-panel": { id: "control-panel", title: "Control Panel", icon: "control-panel", width: 600, height: 420 },
  datetime: { id: "datetime", title: "Date/Time Properties", icon: "datetime", width: 418, height: 430, minWidth: 418, minHeight: 430 },
  defrag: { id: "defrag", title: "Defragmenting Drive C", icon: "computer", width: 500, height: 340, ephemeral: true },
  help: { id: "help", title: "Floppyy Help", icon: "help", width: 560, height: 440, minWidth: 460, minHeight: 360 },
  documents: { id: "documents", title: "My Documents", icon: "documents", width: 720, height: 500 },
  doom: { id: "doom", title: "DOOM", icon: "doom", width: 680, height: 510, minWidth: 480, minHeight: 360 },
  duke3d: { id: "duke3d", title: "Duke Nukem 3D", icon: "duke3d", width: 680, height: 510, minWidth: 480, minHeight: 360 },
  wolf3d: { id: "wolf3d", title: "Wolfenstein 3D", icon: "wolfenstein", width: 680, height: 510, minWidth: 480, minHeight: 360 },
  dune2: { id: "dune2", title: "Dune II", icon: "dune2", width: 680, height: 510, minWidth: 480, minHeight: 360 },
  warcraft: { id: "warcraft", title: "WarCraft: Orcs & Humans", icon: "warcraft", width: 680, height: 510, minWidth: 480, minHeight: 360 },
  drive: { id: "drive", title: "Local Disk", icon: "drive-c", width: 780, height: 550 },
  internet: { id: "internet", title: "Internet", icon: "dialup", width: 360, height: 520, ephemeral: true },
  "ie-browser": { id: "ie-browser", title: "Microsoft Internet Explorer", icon: "ie", width: 840, height: 580 },
  netscape: { id: "netscape", title: "Netscape Navigator", icon: "netscape", width: 760, height: 580 },
  msdos: { id: "msdos", title: "MS-DOS Prompt", icon: "prompt", width: 640, height: 400 },
  notepad: { id: "notepad", title: "Untitled - Notepad", icon: "notepad", width: 600, height: 440 },
  mediaplayer: { id: "mediaplayer", title: "Windows Media Player", icon: "sound", width: 420, height: 380 },
  minesweeper: { id: "minesweeper", title: "Minesweeper", icon: "mine", width: 300, height: 384, minWidth: 168, minHeight: 200, noMaximize: true },
  outlook: { id: "outlook", title: "Outlook Express", icon: "msoutlook", width: 720, height: 500 },
  projects: { id: "projects", title: "Projects", icon: "folder", width: 720, height: 500 },
  profile: { id: "profile", title: "User Profile", icon: "users-share", width: 430, height: 310, minWidth: 360, minHeight: 260 },
  games: { id: "games", title: "Games", icon: "directory_check", width: 780, height: 580 },
  "games-folder": { id: "games-folder", title: "Games", icon: "directory_check", width: 720, height: 500, minWidth: 420, minHeight: 340 },
  guestbook: { id: "guestbook", title: "#floppyy", icon: "guestbook", width: 820, height: 640, minWidth: 560, minHeight: 420 },
  music: { id: "music", title: "Winamp", icon: "winamp", width: 290, height: 650 },
  norton: { id: "norton", title: "Norton Commander", icon: "console", width: 760, height: 500 },
  paint: { id: "paint", title: "untitled - Paint", icon: "paint", width: 800, height: 620 },
  "recycle-bin": { id: "recycle-bin", title: "Recycle Bin", icon: "trash", width: 720, height: 500 },
  screensaver: { id: "screensaver", title: "Display Properties", icon: "monitor", width: 440, height: 580 },
  solitaire: { id: "solitaire", title: "Solitaire", icon: "cards", width: 720, height: 500, minWidth: 560, minHeight: 400 },
  snake: { id: "snake", title: "Snake", icon: "snake", width: 300, height: 350, minWidth: 286, minHeight: 320, noMaximize: true },
  tetris: { id: "tetris", title: "Tetris", icon: "tetris", width: 242, height: 430, minWidth: 230, minHeight: 400, noMaximize: true },
  breakout: { id: "breakout", title: "Breakout", icon: "breakout", width: 370, height: 345, minWidth: 340, minHeight: 320, noMaximize: true },
  "pixel-puzzle": { id: "pixel-puzzle", title: "Pixel Puzzle", icon: "pixelpuzzle", width: 292, height: 342, minWidth: 270, minHeight: 320, noMaximize: true },
  "typing-game": { id: "typing-game", title: "Typing Tutor", icon: "typingtutor", width: 360, height: 260, minWidth: 330, minHeight: 240, noMaximize: true },
  checkers: { id: "checkers", title: "Checkers", icon: "checkers", width: 390, height: 420, minWidth: 340, minHeight: 360 },
  run: { id: "run", title: "Run", icon: "run", width: 380, height: 168, dialog: true },
  settings: { id: "settings", title: "Settings", icon: "gears", width: 520, height: 380 },
  share: { id: "share", title: "Send to a Friend", icon: "garfield", width: 400, height: 555 },
  "project-details": {
    id: "project-details",
    title: "Project Details",
    icon: "folder",
    width: 480,
    height: 380,
  },
};

export type RenderWindow = (props: WindowComponentProps) => ReactNode;

export type DesktopIconDefinition = {
  id: string;
  label: string;
  icon: string;
  windowId?: WindowId;
  payload?: string;
  message?: string;
};

export const desktopIcons: DesktopIconDefinition[] = [
  { id: "computer", label: "My Computer", icon: "computer", windowId: "computer" },
  { id: "dialup", label: "Dial-Up Networking", icon: "dialup", windowId: "internet" },
  { id: "internet", label: "Internet Explorer", icon: "ie", windowId: "ie-browser" },
  { id: "documents", label: "My Documents", icon: "documents", windowId: "documents" },
  { id: "winamp", label: "Winamp", icon: "winamp", windowId: "music" },
  { id: "recycle", label: "Recycle Bin", icon: "trash", windowId: "recycle-bin" },
  { id: "prompt", label: "MS-DOS Prompt", icon: "prompt", windowId: "msdos" },
  { id: "paint", label: "Paint", icon: "painticon", windowId: "paint" },
  { id: "games-folder", label: "Games", icon: "directory_check", windowId: "games-folder" },
  { id: "doom", label: "Doom", icon: "doom", windowId: "doom" },
  { id: "solitaire", label: "Solitaire", icon: "cards", windowId: "solitaire" },
  { id: "minesweeper", label: "Minesweeper", icon: "mine", windowId: "minesweeper" },
  { id: "calculator", label: "Calculator", icon: "calculator", windowId: "calculator" },
  { id: "credits", label: "Credits", icon: "credits", windowId: "about", payload: "welcome" },
  { id: "outlook", label: "Outlook Express", icon: "msoutlook", windowId: "outlook" },
  { id: "notepad", label: "Notepad", icon: "notepad", windowId: "notepad" },
  { id: "netscape", label: "Netscape Navigator", icon: "netscape", windowId: "netscape" },
  { id: "legend", label: "legend", icon: "video", windowId: "mediaplayer", payload: "Rick Astley - Never Gonna Give You Up" },
  { id: "all-star", label: "All Star", icon: "video", windowId: "mediaplayer", payload: "Smash Mouth - All Star" },
  { id: "guestbook", label: "Guest Book", icon: "guestbook", windowId: "guestbook" },
  { id: "share", label: "Share", icon: "garfield", windowId: "share" },
];
