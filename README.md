# Floppyy

<img src="public/og-image.jpg">

Floppyy is a browser desktop built on pure nostalgia.
Boot up, click around, remember everything — minus the dial-up wait.
Mostly.

> The web you grew up on.

![Floppyy](https://img.shields.io/badge/Floppyy-v3.8.0-008080?style=flat-square)
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
- **Notepad** — text editor with File/Edit/Search/Format menus, word wrap
- **Paint** — drawing app with an authentic toolbox (pencil, brush, airbrush, eraser, fill, color picker, text, line, shapes), per-tool size/width options, color palette, and undo
- **Calculator** — functional calculator
- **Internet Explorer** — loads real 1998 websites via Wayback Machine
- **Netscape Navigator** — retro alternative browser
- **MS-DOS Prompt** — command-line interface with working commands
- **Outlook Express** — three-pane email client (Inbox / Outbox / Sent / Deleted), Compose that sends to the Outbox and "delivers" a copy to the Inbox with a *You've got mail* chime, plus Reply and Delete
- **Guest Book (#floppyy)** — ICQ/mIRC-style chat guestbook where visitors sign in real time with retro avatars, ICQ-style statuses, emoticons, safe BBCode formatting (`[b]`, `[i]`, `[url]`), per-IP rate limiting, honeypot and stop-word spam filtering; new signings also arrive as mail in Outlook Express
- **Norton Commander** — dual-pane file manager
- **Windows Media Player** — video playback
- **Winamp** — music player (frameless, authentic skin)
- **My Computer / My Documents / Local Disk** — file system browsing
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

- **Next.js 16.3.8** — App Router, Turbopack
- **React 19.3** — concurrent features
- **TypeScript 6.0** — strict type safety
- **Tailwind CSS 4.3** — utility-first styling + custom Win98 CSS
- **ESLint 10** — linting with the Next.js flat-config compatibility layer
- **Web Audio API** — sound effects
- **Canvas API** — Paint app
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

## Reliability and Mobile Support

- Notepad keeps local drafts and offers Save, Don't Save, or Cancel before replacing or closing modified text.
- Games pause when their window is inactive or the browser tab is hidden. Arrow keys do not interfere with text fields.
- Start submenus stay inside the screen; phones use a scrollable submenu with Back navigation.
- Windows recover inside the viewport after resizing, and Solitaire sizes its cards to the available table width.
- Guest Book loads older history on demand and checks loaded message IDs for moderator deletions. Hidden Guest Book and Outlook windows stop polling.
- Display Properties applies changes only with Apply or OK, saves the screen saver delay, and offers Restore Desktop Layout without clearing other preferences.

## Deployment

Run `bash scripts/deploy.sh` from the server checkout. The script requires a clean Git checkout, `git`, `rsync`, `flock`, and an existing PM2 process named `floppyy` (override with `PM2_APP`). It installs, tests, and builds a staged checkout while the current site keeps serving, then stops only that app for the directory swap. Ignored server files, including environment files, are preserved. `/api/health` must return the expected version before the deploy succeeds; otherwise the previous checkout is restored.

The default origin is `http://127.0.0.1:3018` (`HEALTH_URL` overrides it). Build backups are kept beside the checkout in `.floppyy-releases`; retain them until the release is verified. Cloudflare purge failure is reported separately and does not discard a healthy release. Environment files remain on the server and are never committed.


## License

MIT

---

Visit [www.floppyy.com](https://www.floppyy.com)
