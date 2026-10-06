# Changelog

## 3.8.0 - 2026-10-06

### Fixed
- Notepad now downloads text when Save is selected, protects modified documents on close/replacement, and restores local drafts.
- Game keyboard handlers ignore text fields and inactive windows; games pause when hidden, and Typing Tutor keeps time while typing.
- Checkers no longer captures empty squares, handles blocked players, and correctly ends capture chains on promotion.
- Tetris checks new pieces against the updated board, and Breakout cannot bounce a ball back after it has passed the paddle.
- Solitaire fills its mobile window without clipping columns or leaving unused grey space.
- Start submenus remain reachable on small screens; restored and resized windows keep their title bar controls visible.
- Guest Book removes confirmed moderator deletions, including the newest or last message, without dropping older pages or newer local posts.
- Display Properties now stages wallpaper changes until Apply/OK and persists the screen saver mode and delay. Unsupported settings are disabled.

### Added
- Shared pause/restart/end-of-game dialogs, larger mobile controls, and a desktop layout reset that preserves other settings.
- A shared game catalog for Start and Games folders, focused logic tests, desktop/mobile browser regressions, and GitHub Actions checks.
- A versioned health endpoint and staged PM2 deployment with health checks and automatic build rollback.

### Changed
- Guest Book loads older messages on demand. Guest Book and Outlook polling pauses while hidden.
- Split arcade games into separate components and extracted reusable game/layout logic.
- Release version is shared by Credits, Help, and the health endpoint; refreshed the offline cache name.
- Updated Next.js and `eslint-config-next` to 16.3.8, and React / React DOM to 19.3.0.
- Updated ESLint to 10.12.0, the ESLint compatibility packages, and Node / React type definitions.
- Refreshed dependency locks and aligned the documented Node.js requirement with the development toolchain.
- Kept TypeScript at 6.0.3 because the current TypeScript ESLint integration does not yet support TypeScript 7.

### Known Issues
- The development-only ESLint dependency chain still includes `braces` 3.0.3, affected by GHSA-vfj7-8cjw-p6xm; no patched release is available. The production dependency audit is clean.

## 3.7.0 - 2026-08-16

### Added
- Added Support Floppyy, with Ko-fi and PayPal options available.

### Changed
- Updated Next.js to 16.3.1

## 3.6.0 - 2026-08-14

### Changed
- Updated the runtime and development toolchain: Next.js 16.3.0, React 19.2.8, React DOM 19.2.8, ioredis 6, Tailwind CSS 4.3.3, ESLint 10.8.1, and current React/Node type definitions.
- Updated `eslint-config-next` to 16.3.1 and added the ESLint 10 compatibility layer for the Next flat config.
- Updated TypeScript to 6.0.3, the current version supported by the TypeScript ESLint integration used by Next.
- Refreshed the lockfile and resolved the remaining dependency audit findings.

## 3.5.0 - 2026-07-25

### Changed
- Updated Next.js to 16.2.11 (and `eslint-config-next` to match).

### Fixed
- Guest Book now loads the full message history when it opens instead of only the newest page, so the very first messages are no longer hidden.
- Guest Book polling merges new messages into the loaded history instead of replacing it, and no longer scrolls you back to the bottom while you are reading older entries.

## 3.4.9 - 2026-07-17

### Fixed
- Fixed desktop icon layout migration when new icons are added after users already have saved icon positions.
- Increased desktop icon cell height so longer labels have room and do not overlap the next shortcut.

### Removed
- Removed the visitor counter from About / Credits and deleted the unused visitors API.
- Removed Projects from My Documents.
- Removed the Guest Book share badge shown after sending a message.

## 3.4.8 - 2026-07-17

### Added
- Added Minesweeper to the desktop.

### Changed
- Reduced mobile Solitaire window height to remove extra gray space.
- Moved Breakout mobile controls to the left and right edges for easier play.

## 3.4.7 - 2026-07-17

### Changed
- Made Tetris start with a random first piece.
- Made Breakout launch the ball upward with randomized horizontal direction and speed.
- Centered Breakout mobile controls.
- Added `.exe` suffixes to every game name in the Games folder.
- Tightened mobile Solitaire height and reduced the extra empty area below the table.

## 3.4.6 - 2026-07-17

### Added
- Added a Breakout game-over dialog with New Game and Exit actions.

### Changed
- Removed noisy file-description popups when opening files from disk windows.

## 3.4.5 - 2026-07-17

### Added
- Added a wider randomized word list for Typing Tutor.

### Changed
- Made the Games folder open at the standard folder-window height.
- Made Snake, Tetris, Breakout, Pixel Puzzle and Typing Tutor windows more compact on desktop and mobile.
- Improved mobile sizing for compact game windows so they do not stretch across the full screen.
- Improved mobile Solitaire sizing with tighter card spacing and less empty gray area.

### Fixed
- Fixed Breakout continuing after the ball falls below the paddle.
- Fixed Typing Tutor always starting with the same first word.

## 3.4.4 - 2026-07-17

### Added
- Added mobile-friendly on-screen controls for Snake, Tetris, Breakout and Typing Tutor.
- Added clearer mobile play hints for Pixel Puzzle.

### Changed
- Improved mobile window sizing for Solitaire, Display Properties and Share.
- Scaled Solitaire on mobile so the full table fits inside the window.
- Disabled maximize controls for Snake, Tetris, Breakout, Pixel Puzzle and Typing Tutor.
- Improved mobile window restore and resize clamping so saved desktop window sizes cannot overflow small screens.

### Fixed
- Fixed mobile Solitaire being cropped on narrow screens.
- Fixed Display Properties and Share windows appearing too short on mobile.

## 3.4.0 - 2026-07-15

### Added
- Added retro Guest Book avatars with original pixel-style icons.
- Added avatar support to the Guest Book API, PostgreSQL store, in-memory fallback, profile storage, and database migration.
- Added ICQ-style status choices beyond Online / Do Not Disturb.
- Added safe Guest Book formatting for line breaks, emoticons, `[b]`, `[i]`, and `[url]` without rendering raw HTML.
- Added new Win98-style games: Snake, Tetris, Breakout, Pixel Puzzle, Typing Tutor and Checkers.
- Added local high scores for the new lightweight games where applicable.
- Added new game icons for Snake, Tetris, Breakout, Pixel Puzzle and Typing Tutor.
- Added automatic Dial-Up Networking prompt when Internet Explorer or Netscape is opened while offline.

### Changed
- Enlarged the Guest Book window for the richer composer and avatar controls.
- Moved Guest Book avatar selection next to the Nickname field.
- Enlarged the Games folder window.
- Improved mobile Dial-Up window height.
- Removed the Snake desktop shortcut while keeping Snake available in Start, Games, and `C:\Games`.
- Removed Pong from the current game list.
- Updated Help content for version 3.4.0 and the expanded games lineup.
- Updated README release badge and feature list for 3.4.0.

### Fixed
- Fixed repeated notification sounds from the offline browser Dial-Up prompt.
- Fixed a case where the delayed Dial-Up prompt could fail to open.
- Removed missing icon requests for temporary fallback game icons.
- Fixed the README Getting Started code block formatting.
