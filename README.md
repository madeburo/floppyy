# Floppyy

<img src="public/og-image.jpg">

Floppyy is a browser desktop built on pure nostalgia.
Boot up, click around, remember everything — minus the dial-up wait.
Mostly.

> The web you grew up on.

![Floppyy](https://img.shields.io/badge/Floppyy-v3.9.0-008080?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)

## What is Floppyy?

Floppyy is a retro computer in your browser.

It brings back the feeling of old desktop systems, pixel windows, floppy disks, BIOS boot screens, Winamp vibes, classic games, and the early web — rebuilt as a playful browser experience.

Not an emulator.

Not a productivity tool.

Just a small machine for good old internet memories.

## Features

### Desktop Environment
- BIOS POST → boot sequence → desktop
- Draggable desktop icons with grid snapping
- Drag icons onto the Recycle Bin to delete them (with empty/full bin states and Empty Recycle Bin)
- Right-click desktop context menu with Windows 98 style fly-out submenus (Active Desktop, Arrange Icons, Line Up, Refresh, New, Properties, Empty Recycle Bin)
- Window management — open, close, minimize, maximize, drag, resize, z-order
- Start Menu with programs, Settings (Control Panel, Display Settings, Windows Update), and Shut Down
- Taskbar with Start button, quick launch, window buttons, and a live system tray clock (double-click to open Date/Time)
- Keyboard shortcuts — Ctrl+Esc (Start), Alt+F4 (close), Enter (open), Ctrl+Alt+Backspace (restart)

### Applications
- **Notepad** — text editor with word wrap, automatic draft recovery, Save / Save As to My Documents, and text downloads
- **Paint** — mouse, touch, and stylus drawing with pencil, brush, airbrush, eraser, fill, color picker, lines and shapes; size controls, color palette, undo, Fit / 100% / 200% / 400% zoom, draft recovery, and PNG files in My Documents
- **Calculator** — functional calculator
- **Internet Explorer** — loads real 1998 websites via Wayback Machine
- **Netscape Navigator** — retro alternative browser
- **MS-DOS Prompt** — command-line interface with working commands
- **Outlook Express** — three-pane email client (Inbox / Outbox / Sent / Deleted), Compose that sends to the Outbox and "delivers" a copy to the Inbox with a *You've got mail* chime, plus Reply and Delete
- **Guest Book (#floppyy)** — ICQ/mIRC-style chat guestbook where visitors sign in real time with retro avatars, ICQ-style statuses, emoticons, safe BBCode formatting (`[b]`, `[i]`, `[url]`), per-IP rate limiting, honeypot and stop-word spam filtering; new signings also arrive as mail in Outlook Express
- **Norton Commander** — dual-pane file manager
- **Windows Media Player** — video playback
- **Winamp** — music player (frameless, authentic skin)
- **My Computer / Local Disk** — retro file system browsing
- **My Documents** — personal text and PNG files with open, rename, delete, download, and backup export / restore
- **Projects** — portfolio browser with project details
- **Control Panel & Display Properties** — system configuration, plus switchable wallpapers (the classic Windows 98 set: Clouds, Space, Underwater, Baseball, and more) and screensaver selection
- **Date/Time Properties** — live clock with analog face, calendar, and time zone (double-click the taskbar clock)
- **Disk Defragmenter** — animated defrag utility
- **Recycle Bin** — holds deleted desktop icons, restore or empty
- **Run** dialog — authentic fixed-size dialog with a dropdown listing recent history and every available command
- **Share** dialog, and **About / Credits** — share Floppyy and view project credits
- **Help** — Floppyy Help (getting started, platform-aware keyboard shortcuts, and the full list of secrets)
- **Screensavers** — Pipes, Starfield, Maze, Mystify, Flying Windows

### Games
- **Snake**, **Tetris**, **Breakout**, **Pixel Puzzle**, **Typing Tutor**, and **Checkers** — lightweight Win98-style browser games with local high scores where it makes sense
- **DOOM**, **Duke Nukem 3D**, **Wolfenstein 3D**, **Dune II**, and **WarCraft: Orcs & Humans** — MS-DOS classics running in-browser via js-dos (DOSBox). Grouped in the desktop **Games** folder and under **Start → Games**.
- **Minesweeper** — classic mine-clearing puzzle
- **Solitaire** — card game (drag or click-to-move)

> **Desktop only:** the DOS games (DOOM, Duke Nukem 3D, Wolfenstein 3D, Dune II, WarCraft) need a physical keyboard and mouse, so they only run on a desktop or laptop. On phones and tablets they show a "Desktop only" message instead. Click inside a game to capture the mouse/keyboard.

### System
- Sound effects via Web Audio API with oscillator fallback
- Offline browsers automatically offer Dial-Up Networking after a short delay
- Screensaver activation after idle timeout
- Service worker for offline support
- Safe Mode boot option
- Shut Down with "It's now safe to turn off your computer" screen
- Share dialog for social sharing
- **Window session persistence** — open windows and their positions/sizes are restored on reload (one-shot dialogs excluded)
- **Code-split windows** — heavy apps (DOS games, Paint, Internet Explorer, Netscape, Media Player, Norton Commander) are lazy-loaded on demand to keep the first paint fast

## Easter Eggs

Floppyy occasionally fights back. A few things to try — the full list lives in **Start → Help → Tips & Secrets**:

- Open **My Computer** four times in a row to trigger a cascade of errors → blue screen → reboot
- Press **Ctrl+Alt+Backspace** (⌃ + ⌥ + ⌫ on Mac) for an on-demand crash & restart
- Type `format c:`, `del *.*`, or `deltree` into the **Run** dialog... and say goodbye
- Internet Explorer and Netscape occasionally throw a fatal error mid-browse (true to the era)
- A few minutes into a session, McAfee "finds a virus" — once per machine, and it's bluffing
- Lose at Minesweeper and the computer may rub it in
- Secret **Run** words: `llama`, `nostalgia`, `clouds`, `stars`, `floppyy`
- Drag My Computer onto the Recycle Bin — Floppyy will refuse

## Tech Stack

- **Next.js 16.4.2** — App Router, Turbopack
- **React 19.3.1** — concurrent features
- **TypeScript 6.0** — strict type safety
- **Tailwind CSS 4.3** — utility-first styling + custom Win98 CSS
- **ESLint 10** — linting with the Next.js flat-config compatibility layer
- **Web Audio API** — sound effects
- **Canvas API** — Paint app
- **IndexedDB** — browser-local personal files and editor drafts
- **js-dos (DOSBox)** — in-browser MS-DOS games (DOOM, Duke Nukem 3D, Wolfenstein 3D, Dune II, WarCraft), run in an isolated iframe
- **HTML5 Video** — Media Player
- **Service Worker** — offline caching
- **Route Handlers + Postgres + Redis** — Guest Book storage, moderation, and rate limiting

## Getting Started

> Requires Node.js 20.19+ (20.x), 22.13+ (22.x), or 24+. Node.js 24 LTS is recommended for production.
> TypeScript stays on 6.0 until the Next.js TypeScript ESLint integration supports TypeScript 7.

```bash
# Install dependencies
npm ci

# Development server
npm run dev

# Production build
npm run build
npm start

# Lint / React Compiler checks
npm run lint

# Logic regression tests
npm test

# Browser regressions (desktop Chromium and mobile WebKit)
npx playwright install chromium webkit
npm run test:e2e

# Dependency security audit
npm audit
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Personal Files

Notepad and Paint save into **My Documents** using **File > Save** or **Save As**. Double-click a saved file to reopen it in its editor. **Download** saves a separate `.txt` or `.png` copy to your device. My Documents also offers rename and confirmed deletion.

Edits are automatically stored as recovery drafts after text changes or completed drawing strokes. Reopening the same document restores its draft. Save commits the draft to the file; closing or replacing modified work offers Save, Don't Save, or Cancel. Existing Notepad local drafts are migrated when opened. Conflicting saves from another tab are rejected instead of silently overwriting newer files.

Use **My Documents > File > Export Backup** to download a `Floppyy.floppyy.json` archive of saved personal files. **Restore Backup** validates the archive before importing; existing files stay intact and duplicate names receive a numeric suffix. Recovery drafts, built-in example files, and desktop settings are not included. Save open work before exporting.

Files live only in this browser's storage for this site. They are not uploaded or synced between devices, browsers, or domains. Clearing site data, private browsing, or browser storage eviction can remove them: keep a downloaded backup. Limits are 200 files, 6 MB per file, and a 48 MB backup (including JSON overhead). Paint uses a 640 x 400 canvas. Text and selection tools remain disabled.

## Reliability and Mobile Support

- Notepad and Paint keep local drafts and protect modified documents before close or replacement. Storage failures are shown explicitly; downloads remain available.
- Paint supports pointer capture for mouse, touch, and stylus, including strokes that leave the canvas. Zoom changes the view without changing the image resolution; Pan moves around a zoomed canvas without drawing.
- Games pause when their window is inactive or the browser tab is hidden. Arrow keys do not interfere with text fields.
- Start submenus stay inside the screen; phones use a scrollable submenu with Back navigation.
- Windows recover inside the viewport after resizing, and Solitaire sizes its cards to the available table width.
- Guest Book loads older history on demand and checks loaded message IDs for moderator deletions. Hidden Guest Book and Outlook windows stop polling.
- Display Properties applies changes only with Apply or OK, saves the screen saver delay, and offers Restore Desktop Layout without clearing other preferences.

## Deployment

Run `bash scripts/deploy.sh` from the server checkout. The script requires a clean Git checkout, `git`, `rsync`, `flock`, and an existing PM2 process named `floppyy` (override with `PM2_APP`). It installs, tests, and builds a staged checkout while the current site keeps serving, then stops only that app for the directory swap. Ignored server files, including environment files, are preserved. `/api/health` must return the expected version before the deploy succeeds; otherwise the previous checkout is restored.

The default origin is `http://127.0.0.1:3018` (`HEALTH_URL` overrides it). Build backups are kept beside the checkout in `.floppyy-releases`; retain them until the release is verified. Cloudflare purge failure is reported separately and does not discard a healthy release. Environment files remain on the server and are never committed.

Umami analytics keeps its existing website ID. Set the public tracker URLs in the private environment file before building:

```dotenv
NEXT_PUBLIC_UMAMI_SRC=https://umami.withnohype.com/mb.js
NEXT_PUBLIC_UMAMI_RECORDER_SRC=https://umami.withnohype.com/recorder.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID=51b3c545-08e8-466b-8430-3edeeb71afdc
```



## License

MIT

---

Visit [www.floppyy.com](https://www.floppyy.com)
