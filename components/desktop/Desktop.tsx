"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import dynamic from "next/dynamic";
import { BootScreen, BootMode } from "@/components/boot/BootScreen";
import { WindowLoading } from "@/components/windows/WindowLoading";
import { ContextMenu } from "./ContextMenu";
import { DesktopIcon } from "./DesktopIcon";
import { NotificationBalloon } from "./NotificationBalloon";
import { NotificationDialog } from "./NotificationDialog";
import { StartMenu } from "./StartMenu";
import { Taskbar } from "./Taskbar";
import { WindowFrame } from "@/components/windows/WindowFrame";
import { WindowActivity } from "@/components/windows/WindowActivity";
import { isTextInput } from "@/lib/keyboard";
import { AboutWindow } from "@/components/windows/AboutWindow";
import { CalculatorWindow } from "@/components/windows/CalculatorWindow";
import { ComputerWindow } from "@/components/windows/ComputerWindow";
import { ControlPanelWindow } from "@/components/windows/ControlPanelWindow";
import { DateTimeWindow } from "@/components/windows/DateTimeWindow";
import { GamesWindow } from "@/components/windows/GamesWindow";
import { GamesFolderWindow } from "@/components/windows/GamesFolderWindow";
import { GuestbookWindow } from "@/components/windows/GuestbookWindow";
import { InternetWindow } from "@/components/windows/InternetWindow";
import { MsDosWindow } from "@/components/windows/MsDosWindow";
import { MinesweeperWindow } from "@/components/windows/MinesweeperWindow";
import { SolitaireWindow } from "@/components/windows/SolitaireWindow";
import { RetroGameWindow } from "@/components/windows/RetroGameWindow";
import { MusicWindow } from "@/components/windows/MusicWindow";
import { NotepadWindow } from "@/components/windows/NotepadWindow";
import { OutlookWindow } from "@/components/windows/OutlookWindow";
import { ProjectDetailsWindow } from "@/components/windows/ProjectDetailsWindow";
import { ProjectsWindow } from "@/components/windows/ProjectsWindow";
import { UserProfileWindow } from "@/components/windows/UserProfileWindow";
import { RunWindow } from "@/components/windows/RunWindow";
import { ScreensaverWindow } from "@/components/windows/ScreensaverWindow";
import { SettingsWindow } from "@/components/windows/SettingsWindow";
import { ShareWindow } from "@/components/windows/ShareWindow";
import { DefragWindow } from "@/components/windows/DefragWindow";
import { HelpWindow } from "@/components/windows/HelpWindow";
import { DocumentsWindow } from "@/components/windows/DocumentsWindow";
import { DriveWindow } from "@/components/windows/DriveWindow";
import { RecycleBinWindow } from "@/components/windows/RecycleBinWindow";
import { ShutDownOverlay } from "@/components/windows/ShutDownOverlay";
import { CrashSequence } from "@/components/windows/CrashSequence";
import { Win98ErrorDialog } from "@/components/windows/Win98ErrorDialog";
import { McAfeeVirusAlert } from "@/components/windows/McAfeeVirusAlert";
import { ScreensaverOverlay } from "@/components/screensavers/ScreensaverOverlay";
import { useDoubleClick } from "@/hooks/useDoubleClick";
import { useScreensaver } from "@/hooks/useScreensaver";
import { useSound } from "@/hooks/useSound";
import { useWindowManager } from "@/hooks/useWindowManager";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { desktopIcons, DesktopWindow, WindowComponentProps, WindowId } from "@/lib/windows";
import { DEFAULT_WALLPAPER, isWallpaperId, WALLPAPERS, WallpaperId, wallpaperStyle } from "@/lib/wallpapers";

const DosGameWindow = dynamic(() => import("@/components/windows/DosGameWindow").then((m) => m.DosGameWindow), {
  ssr: false,
  loading: () => <WindowLoading />,
});
const PaintWindow = dynamic(() => import("@/components/windows/PaintWindow").then((m) => m.PaintWindow), {
  ssr: false,
  loading: () => <WindowLoading />,
});
const NortonCommanderWindow = dynamic(
  () => import("@/components/windows/NortonCommanderWindow").then((m) => m.NortonCommanderWindow),
  { ssr: false, loading: () => <WindowLoading /> },
);
const IEBrowserWindow = dynamic(() => import("@/components/windows/IEBrowserWindow").then((m) => m.IEBrowserWindow), {
  ssr: false,
  loading: () => <WindowLoading />,
});
const NetscapeWindow = dynamic(() => import("@/components/windows/NetscapeWindow").then((m) => m.NetscapeWindow), {
  ssr: false,
  loading: () => <WindowLoading />,
});
const MediaPlayerWindow = dynamic(() => import("@/components/windows/MediaPlayerWindow").then((m) => m.MediaPlayerWindow), {
  ssr: false,
  loading: () => <WindowLoading />,
});

const GAME_WINDOW_IDS = new Set<WindowId>(["doom", "duke3d", "wolf3d", "dune2", "warcraft"]);

type MenuState = { x: number; y: number; target?: string } | null;
type IconPosition = { x: number; y: number };
type IconDrag = {
  id: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
} | null;
type WindowDrag = { instanceId: string; dx: number; dy: number } | null;

const ICON_WIDTH = 75;
const ICON_HEIGHT = 76;
const ICON_COLUMN_GAP = 4;
const ICON_ROW_GAP = 4;
const ICON_STEP_X = ICON_WIDTH + ICON_COLUMN_GAP;
const ICON_STEP_Y = ICON_HEIGHT + ICON_ROW_GAP;
const DESKTOP_PADDING = 6;
const TASKBAR_HEIGHT = 28;

function initialIconPositions() {
  return iconGridPositions(desktopIcons.map((icon) => icon.id));
}

function iconGridPositions(ids: string[]) {
  const availableHeight = typeof window === "undefined" ? 740 : window.innerHeight - TASKBAR_HEIGHT - DESKTOP_PADDING * 2;
  const availableWidth = typeof window === "undefined" ? 1024 : window.innerWidth - DESKTOP_PADDING * 2;
  const rows = Math.max(1, Math.floor(availableHeight / ICON_STEP_Y));
  const maxCols = Math.max(1, Math.floor(availableWidth / ICON_STEP_X));
  return Object.fromEntries(
    ids.map((id, index) => {
      if (id === "share") {
        return [
          id,
          {
            x: DESKTOP_PADDING + (maxCols - 1) * ICON_STEP_X,
            y: DESKTOP_PADDING + (rows - 1) * ICON_STEP_Y,
          },
        ];
      }
      const column = Math.floor(index / rows);
      const row = index % rows;
      return [
        id,
        {
          x: DESKTOP_PADDING + column * ICON_STEP_X,
          y: DESKTOP_PADDING + row * ICON_STEP_Y,
        },
      ];
    }),
  ) as Record<string, IconPosition>;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function cellKey(column: number, row: number) {
  return `${column}:${row}`;
}

function nearestFreeGridPosition(id: string, x: number, y: number, positions: Record<string, IconPosition>) {
  const maxRows = Math.max(1, Math.floor((window.innerHeight - TASKBAR_HEIGHT - DESKTOP_PADDING * 2) / ICON_STEP_Y));
  const maxColumns = Math.max(1, Math.floor((window.innerWidth - DESKTOP_PADDING * 2) / ICON_STEP_X));
  const targetColumn = clamp(Math.round((x - DESKTOP_PADDING) / ICON_STEP_X), 0, maxColumns - 1);
  const targetRow = clamp(Math.round((y - DESKTOP_PADDING) / ICON_STEP_Y), 0, maxRows - 1);
  const occupied = new Set<string>();

  Object.entries(positions).forEach(([otherId, position]) => {
    if (otherId === id) return;
    const column = clamp(Math.round((position.x - DESKTOP_PADDING) / ICON_STEP_X), 0, maxColumns - 1);
    const row = clamp(Math.round((position.y - DESKTOP_PADDING) / ICON_STEP_Y), 0, maxRows - 1);
    occupied.add(cellKey(column, row));
  });

  for (let radius = 0; radius <= Math.max(maxRows, maxColumns); radius += 1) {
    for (let column = targetColumn - radius; column <= targetColumn + radius; column += 1) {
      for (let row = targetRow - radius; row <= targetRow + radius; row += 1) {
        if (column < 0 || row < 0 || column >= maxColumns || row >= maxRows) continue;
        if (Math.max(Math.abs(column - targetColumn), Math.abs(row - targetRow)) !== radius) continue;
        if (!occupied.has(cellKey(column, row))) {
          return {
            x: DESKTOP_PADDING + column * ICON_STEP_X,
            y: DESKTOP_PADDING + row * ICON_STEP_Y,
          };
        }
      }
    }
  }

  return {
    x: DESKTOP_PADDING + targetColumn * ICON_STEP_X,
    y: DESKTOP_PADDING + targetRow * ICON_STEP_Y,
  };
}

function readStoredWallpaper(): WallpaperId {
  try {
    const savedWallpaper = globalThis.localStorage.getItem("floppyy-wallpaper");
    return isWallpaperId(savedWallpaper) ? savedWallpaper : DEFAULT_WALLPAPER;
  } catch {
    return DEFAULT_WALLPAPER;
  }
}

function readStoredIconPositions(): Record<string, IconPosition> {
  const positions = initialIconPositions();
  try {
    const savedIcons = globalThis.localStorage.getItem("floppyy-icon-positions");
    if (!savedIcons) return positions;
    const parsed = JSON.parse(savedIcons) as Record<string, IconPosition>;
    if (!parsed || typeof parsed !== "object") return positions;
    const hasEveryCurrentIcon = desktopIcons.every((icon) => parsed[icon.id]);
    if (!hasEveryCurrentIcon) return positions;
    const current = Object.fromEntries(desktopIcons.map((icon) => [icon.id, parsed[icon.id]]));
    if (Object.values(current).some((position) => !position || !Number.isFinite(position.x) || !Number.isFinite(position.y) || position.x < 0 || position.y < 0 || position.x + 64 > window.innerWidth || position.y + 70 > window.innerHeight - 28)) return positions;

    return { ...positions, ...current };
  } catch {
    return positions;
  }
}

export default function Desktop() {
  const [booted, setBooted] = useState(false);
  const [bootMode, setBootMode] = useState<BootMode>("normal");
  const [dialupDone, setDialupDone] = useState(false);
  const [pendingStartup, setPendingStartup] = useState(false);
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(() => new Set());
  const [marquee, setMarquee] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<MenuState>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; icon?: string; titleIcon?: string; persistent?: boolean; balloon?: boolean } | null>(null);
  const [connectionStatusOpen, setConnectionStatusOpen] = useState(false);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [mcAfeeOpen, setMcAfeeOpen] = useState(false);
  const [shutdownOpen, setShutdownOpen] = useState(false);
  const [safeToTurnOff, setSafeToTurnOff] = useState(false);
  const [crash, setCrash] = useState<null | { variant: "cascade" | "fatal"; message?: string }>(null);
  const [errorPopup, setErrorPopup] = useState<null | { title: string; message: string }>(null);
  const [virusAlertOpen, setVirusAlertOpen] = useState(false);
  const [iconPositions, setIconPositions] = useState<Record<string, IconPosition>>(readStoredIconPositions);
  const [wallpaper, setWallpaper] = useState<WallpaperId>(readStoredWallpaper);
  const [binItems, setBinItems] = useState<Set<string>>(() => new Set());
  const [emptiedIcons, setEmptiedIcons] = useState<Set<string>>(() => new Set());
  const iconDrag = useRef<IconDrag>(null);
  const [winampDrag, setWinampDrag] = useState<WindowDrag>(null);
  // Tracks rapid, consecutive "My Computer" opens for the crash easter egg.
  const computerSpamRef = useRef({ count: 0, last: 0 });
  const iconPositionsLoaded = useRef(true);
  const desktopRef = useRef<HTMLDivElement>(null);
  const marqueeDrag = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const suppressClickClear = useRef(false);
  const wm = useWindowManager();
  const {
    closeWindow: closeManagedWindow,
    minimizeWindow,
    resizeWindow,
  } = wm;
  const { playSound, warmSound, fadeOutSound, muted, setMuted, volume, setVolume } = useSound();

  // The screensaver's activity listeners never fire while you're playing a
  // DOS/canvas game (input is captured by the game) or watching a video (you
  // just sit still). Suspend the idle timer whenever such a window is open and
  // not minimized so it can't pop up over gameplay or a video.
  const screensaverSuppressed = wm.windows.some(
    (item) =>
      !item.minimized &&
      (GAME_WINDOW_IDS.has(item.id) || (item.id === "mediaplayer" && !!item.payload)),
  );
  const screensaver = useScreensaver(screensaverSuppressed);
  useServiceWorker();

  // Persist wallpaper + icon layout when they change (after initial load).
  useEffect(() => {
    try {
      globalThis.localStorage.setItem("floppyy-wallpaper", wallpaper);
    } catch {
      /* ignore */
    }
  }, [wallpaper]);

  useEffect(() => {
    if (!iconPositionsLoaded.current) return;
    try {
      globalThis.localStorage.setItem("floppyy-icon-positions", JSON.stringify(iconPositions));
    } catch {
      /* ignore */
    }
  }, [iconPositions]);

  const notify = useCallback(
    (message: string, options?: { icon?: string; titleIcon?: string; persistent?: boolean; balloon?: boolean }) => {
      setNotification({ message, icon: options?.icon, titleIcon: options?.titleIcon, persistent: options?.persistent, balloon: options?.balloon });
      playSound("notification");
      if (!options?.persistent) {
        window.setTimeout(() => setNotification((current) => (current?.message === message ? null : current)), 2800);
      }
    },
    [playSound],
  );

  const openWindow = useCallback(
    (id: WindowId, payload?: string) => {
      if (id === "internet" && dialupDone) {
        setConnectionStatusOpen(true);
        setStartOpen(false);
        setContextMenu(null);
        playSound("click");
        return;
      }

      // Easter egg: hammering "My Computer" open a few times in a row makes
      // the whole system buckle — error cascade, blue screen, then reboot.
      if (id === "computer") {
        const tracker = computerSpamRef.current;
        const nowTs = Date.now();
        tracker.count = nowTs - tracker.last < 2000 ? tracker.count + 1 : 1;
        tracker.last = nowTs;
        if (tracker.count >= 4) {
          tracker.count = 0;
          setStartOpen(false);
          setContextMenu(null);
          setCrash({ variant: "cascade" });
          return;
        }
      } else {
        computerSpamRef.current.count = 0;
      }

      wm.openWindow(id, payload);
      setStartOpen(false);
      setContextMenu(null);
      playSound("open");
    },
    [dialupDone, playSound, wm],
  );

  const handleDialupConnected = useCallback(() => {
    setDialupDone(true);
    setConnectedAt(Date.now());
  }, []);

  const crashSystem = useCallback(
    (options?: { variant?: "cascade" | "fatal"; message?: string }) => {
      setCrash((current) => current ?? { variant: options?.variant ?? "cascade", message: options?.message });
    },
    [],
  );

  const handleQuickLaunch = useCallback(
    (id: string) => {
      if (id === "internet") {
        openWindow("ie-browser");
      } else {
        openWindow(id as WindowId);
      }
    },
    [openWindow],
  );

  const handleShowDesktop = useCallback(() => {
    wm.minimizeAll();
    playSound("click");
  }, [wm, playSound]);

  const iconClick = useDoubleClick<string>(
    (id) => {
      setSelectedIcons(new Set([id]));
      playSound("click");
    },
    (id) => {
      setSelectedIcons(new Set([id]));
      const icon = desktopIcons.find((item) => item.id === id);
      if (icon?.windowId) {
        if (id === "recycle") playSound("recycle");
        openWindow(icon.windowId, icon.payload);
      } else {
        if (id === "recycle") playSound("recycle");
        notify(icon?.message ?? "Shortcut is resting on the desktop.");
      }
    },
  );

  const moveIcon = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = iconDrag.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 4) {
      drag.moved = true;
    }
    if (!drag.moved) return;
    setIconPositions((positions) => ({
      ...positions,
      [drag.id]: {
        x: clamp(drag.originX + dx, 0, window.innerWidth - ICON_WIDTH),
        y: clamp(drag.originY + dy, 0, window.innerHeight - TASKBAR_HEIGHT - ICON_HEIGHT),
      },
    }));
  }, []);

  const releaseIcon = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = iconDrag.current;
      if (!drag) return;
      event.currentTarget.releasePointerCapture(event.pointerId);
      iconDrag.current = null;
      if (!drag.moved) {
        iconClick(drag.id);
        return;
      }

      const recyclePosition = iconPositions["recycle"];
      const overRecycleBin =
        drag.id !== "recycle" &&
        !!recyclePosition &&
        event.clientX >= recyclePosition.x &&
        event.clientX <= recyclePosition.x + ICON_WIDTH &&
        event.clientY >= recyclePosition.y &&
        event.clientY <= recyclePosition.y + ICON_HEIGHT;

      if (overRecycleBin) {
        if (drag.id === "computer" || drag.id === "dialup") {
          playSound("error");
          setErrorPopup(
            drag.id === "computer"
              ? {
                  title: "Delete",
                  message: "Cannot delete My Computer. It is required for reality to keep running.",
                }
              : {
                  title: "Delete",
                  message: "Cannot delete Dial-Up Networking. How else would you get online?",
                },
          );
          setIconPositions((positions) => ({
            ...positions,
            [drag.id]: { x: drag.originX, y: drag.originY },
          }));
          return;
        }

        setBinItems((previous) => {
          const next = new Set(previous);
          next.add(drag.id);
          return next;
        });
        setSelectedIcons((current) => {
          if (!current.has(drag.id)) return current;
          const next = new Set(current);
          next.delete(drag.id);
          return next;
        });
        setIconPositions((positions) => ({
          ...positions,
          [drag.id]: { x: drag.originX, y: drag.originY },
        }));
        playSound("recycle");
        return;
      }

      setIconPositions((positions) => ({
        ...positions,
        [drag.id]: nearestFreeGridPosition(drag.id, positions[drag.id]?.x ?? drag.originX, positions[drag.id]?.y ?? drag.originY, positions),
      }));
      playSound("click");
    },
    [iconClick, playSound, iconPositions],
  );

  const emptyRecycleBin = useCallback(() => {
    setBinItems((previous) => {
      if (previous.size === 0) {
        notify("Recycle Bin is already empty.");
        return previous;
      }
      setEmptiedIcons((gone) => {
        const next = new Set(gone);
        previous.forEach((id) => next.add(id));
        return next;
      });
      playSound("recycle");
      return new Set();
    });
    setContextMenu(null);
  }, [notify, playSound]);

  const restoreAllFromRecycleBin = useCallback(() => {
    setBinItems((previous) => {
      if (previous.size === 0) {
        notify("There are no items to restore.");
        return previous;
      }
      playSound("click");
      return new Set();
    });
  }, [notify, playSound]);

  const arrangeIcons = useCallback(() => {
    setIconPositions(initialIconPositions());
    setContextMenu(null);
    playSound("click");
  }, [playSound]);

  useEffect(() => {
    const fitIcons = () => {
      setIconPositions((positions) => {
        const outside = Object.values(positions).some((point) => point.x + ICON_WIDTH > window.innerWidth || point.y + ICON_HEIGHT > window.innerHeight - TASKBAR_HEIGHT || !Number.isFinite(point.x) || !Number.isFinite(point.y));
        return outside ? initialIconPositions() : positions;
      });
    };
    window.addEventListener("resize", fitIcons);
    return () => window.removeEventListener("resize", fitIcons);
  }, []);

  const lineUpIcons = useCallback(() => {
    const orderedIds = desktopIcons
      .map((icon) => icon.id)
      .sort((a, b) => {
        const aPosition = iconPositions[a] ?? { x: 0, y: 0 };
        const bPosition = iconPositions[b] ?? { x: 0, y: 0 };
        return aPosition.x - bPosition.x || aPosition.y - bPosition.y;
      });
    setIconPositions(iconGridPositions(orderedIds));
    setContextMenu(null);
    playSound("click");
  }, [iconPositions, playSound]);

  const refreshDesktop = useCallback(() => {
    setContextMenu(null);
    setSelectedIcons(new Set());
    notify("Desktop refreshed.", { balloon: true });
  }, [notify]);

  const startMarquee = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    suppressClickClear.current = false;
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;
    setContextMenu(null);
    setStartOpen(false);
    setSelectedIcons(new Set());
    marqueeDrag.current = {
      startX: event.clientX - rect.left,
      startY: event.clientY - rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const updateMarquee = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = marqueeDrag.current;
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;

    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    const left = Math.min(drag.startX, currentX);
    const top = Math.min(drag.startY, currentY);
    const width = Math.abs(currentX - drag.startX);
    const height = Math.abs(currentY - drag.startY);

    if (!drag.moved && Math.hypot(width, height) > 4) {
      drag.moved = true;
    }
    if (!drag.moved) return;

    setMarquee({ left, top, width, height });

    const hits = new Set<string>();
    desktopIcons.forEach((icon) => {
      if (binItems.has(icon.id) || emptiedIcons.has(icon.id)) return;
      const position = iconPositions[icon.id];
      if (!position) return;
      const intersects =
        left < position.x + ICON_WIDTH &&
        left + width > position.x &&
        top < position.y + ICON_HEIGHT &&
        top + height > position.y;
      if (intersects) hits.add(icon.id);
    });
    setSelectedIcons(hits);
  }, [binItems, emptiedIcons, iconPositions]);

  const endMarquee = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = marqueeDrag.current;
    if (!drag) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.moved) suppressClickClear.current = true;
    marqueeDrag.current = null;
    setMarquee(null);
  }, []);

  const showProperties = useCallback(() => {
    const target = contextMenu?.target;
    if (!target || target === "computer") {
      openWindow("screensaver");
    } else {
      const icon = desktopIcons.find((item) => item.id === target);
      notify(`${icon?.label ?? "Shortcut"} properties are not installed.`);
    }
    setContextMenu(null);
  }, [contextMenu, notify, openWindow]);

  const renderWindow = (props: WindowComponentProps) => {
    switch (props.window.id) {
      case "about":
        return <AboutWindow {...props} />;
      case "calculator":
        return <CalculatorWindow {...props} />;
      case "computer":
        return <ComputerWindow {...props} />;
      case "control-panel":
        return <ControlPanelWindow {...props} />;
      case "datetime":
        return <DateTimeWindow {...props} />;
      case "projects":
        return <ProjectsWindow {...props} />;
      case "profile":
        return <UserProfileWindow {...props} />;
      case "project-details":
        return <ProjectDetailsWindow {...props} />;
      case "internet":
        return <InternetWindow {...props} onConnected={handleDialupConnected} />;
      case "ie-browser":
        return <IEBrowserWindow {...props} />;
      case "netscape":
        return <NetscapeWindow {...props} />;
      case "msdos":
        return <MsDosWindow {...props} />;
      case "mediaplayer":
        return <MediaPlayerWindow {...props} />;
      case "minesweeper":
        return <MinesweeperWindow {...props} />;
      case "solitaire":
        return <SolitaireWindow {...props} />;
      case "snake":
      case "tetris":
      case "breakout":
      case "pixel-puzzle":
      case "typing-game":
      case "checkers":
        return <RetroGameWindow {...props} />;
      case "games":
        return <GamesWindow {...props} />;
      case "games-folder":
        return <GamesFolderWindow {...props} />;
      case "guestbook":
        return <GuestbookWindow {...props} />;
      case "doom":
      case "duke3d":
      case "wolf3d":
      case "dune2":
      case "warcraft":
        return <DosGameWindow {...props} />;
      case "music":
        return <MusicWindow {...props} />;
      case "norton":
        return <NortonCommanderWindow {...props} />;
      case "notepad":
        return <NotepadWindow key={props.window.payload ?? "untitled"} {...props} />;
      case "outlook":
        return <OutlookWindow {...props} />;
      case "paint":
        return <PaintWindow {...props} />;
      case "run":
        return <RunWindow {...props} />;
      case "settings":
        return <SettingsWindow {...props} />;
      case "share":
        return <ShareWindow {...props} />;
      case "defrag":
        return <DefragWindow {...props} />;
      case "help":
        return <HelpWindow {...props} />;
      case "documents":
        return <DocumentsWindow {...props} />;
      case "drive":
        return <DriveWindow {...props} />;
      case "recycle-bin":
        return (
          <RecycleBinWindow
            {...props}
            items={desktopIcons.filter((icon) => binItems.has(icon.id))}
            onEmptyBin={emptyRecycleBin}
            onRestoreAll={restoreAllFromRecycleBin}
          />
        );
      case "screensaver":
        return <ScreensaverWindow {...props} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!pendingStartup) return;
    const play = () => {
      playSound("startup");
      setPendingStartup(false);
    };
    window.addEventListener("pointerdown", play, { once: true });
    window.addEventListener("keydown", play, { once: true });
    return () => {
      window.removeEventListener("pointerdown", play);
      window.removeEventListener("keydown", play);
    };
  }, [pendingStartup, playSound]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
        setStartOpen(false);
      }
      if (event.ctrlKey && event.key === "Escape") {
        event.preventDefault();
        setStartOpen((value) => !value);
      }
      if (event.altKey && event.key === "F4" && wm.activeWindow) {
        event.preventDefault();
        wm.closeWindow(wm.activeWindow.instanceId);
        playSound("close");
      }
      if (event.ctrlKey && event.altKey && (event.key === "Backspace" || event.code === "Backspace")) {
        event.preventDefault();
        crashSystem({ variant: "cascade" });
      }
      if (event.key === "Enter" && !isTextInput(event.target) && !(event.target instanceof HTMLElement && event.target.closest('[role="dialog"], [role="menu"], [aria-label="Start menu"]')) && selectedIcons.size > 0) {
        const firstId = selectedIcons.values().next().value;
        const icon = desktopIcons.find((item) => item.id === firstId);
        if (icon?.windowId) openWindow(icon.windowId, icon.payload);
        else if (icon?.message) notify(icon.message);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [notify, openWindow, playSound, selectedIcons, wm, crashSystem]);

  useEffect(() => {
    if (!booted) return;
    try {
      if (globalThis.localStorage.getItem("floppyy-mcafee-prank") === "done") return;
    } catch {
      /* localStorage unavailable — just skip the prank */
      return;
    }
    const delay = 240000; // 4 minutes
    const timer = window.setTimeout(() => {
      try {
        globalThis.localStorage.setItem("floppyy-mcafee-prank", "done");
      } catch {
        /* ignore */
      }
      setVirusAlertOpen(true);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [booted]);

  const commonProps = useMemo(
    () => ({
      openWindow,
      closeWindow: (instanceId: string) => {
        closeManagedWindow(instanceId);
        playSound("close");
      },
      minimizeWindow,
      resizeWindow,
      registerCloseGuard: wm.registerCloseGuard,
      notify,
      playSound,
      warmSound,
      fadeOutSound,
      startScreensaver: screensaver.start,
      setDefaultScreensaver: screensaver.setMode,
      screensaverMode: screensaver.defaultMode,
      screensaverWait: screensaver.waitMinutes,
      setScreensaverWait: screensaver.setWaitMinutes,
      resetDesktopLayout: arrangeIcons,
      crashSystem,
      wallpaper,
      setWallpaper: (id: string) => {
        if (isWallpaperId(id)) setWallpaper(id);
      },
      internetConnected: dialupDone,
      muted,
    }),
    [
      notify,
      openWindow,
      closeManagedWindow,
      playSound,
      warmSound,
      fadeOutSound,
      screensaver.start,
      screensaver.setMode,
      screensaver.defaultMode,
      screensaver.waitMinutes,
      screensaver.setWaitMinutes,
      arrangeIcons,
      crashSystem,
      wallpaper,
      minimizeWindow,
      resizeWindow,
      wm.registerCloseGuard,
      dialupDone,
      muted,
    ],
  );

  if (!booted) {
    return (
      <BootScreen
        onComplete={(mode) => {
          setBootMode(mode);
          setBooted(true);
          setPendingStartup(true);
        }}
        playSound={playSound}
      />
    );
  }

  const isSafeMode = bootMode === "safe";

  const showDialupHint =
    !dialupDone &&
    wm.windows.some((item) => (item.id === "ie-browser" || item.id === "netscape") && !item.minimized);

  const activeWallpaper = WALLPAPERS[wallpaper] ?? WALLPAPERS[DEFAULT_WALLPAPER];
  const wallpaperClass = isSafeMode ? "" : activeWallpaper.className ?? "";
  const desktopWallpaperStyle = !isSafeMode ? wallpaperStyle(activeWallpaper) : undefined;

  return (
    <main
      className={`h-screen w-screen overflow-hidden pb-[28px] ${isSafeMode ? "bg-[#008080]" : wallpaperClass}`}
      style={desktopWallpaperStyle}
      onClick={() => {
        if (suppressClickClear.current) {
          suppressClickClear.current = false;
          return;
        }
        setContextMenu(null);
        setStartOpen(false);
        setSelectedIcons(new Set());
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY });
      }}
    >
      <div
        ref={desktopRef}
        className="relative h-[calc(100vh-28px)]"
        onPointerDown={startMarquee}
        onPointerMove={updateMarquee}
        onPointerUp={endMarquee}
      >
        {marquee && (
          <div
            className="pointer-events-none absolute z-[10]"
            style={{
              left: marquee.left,
              top: marquee.top,
              width: marquee.width,
              height: marquee.height,
              background: "rgba(0, 0, 128, 0.35)",
              border: "1px dotted #ffffff",
            }}
          />
        )}
        {desktopIcons
          .filter((icon) => !binItems.has(icon.id) && !emptiedIcons.has(icon.id))
          .map((icon) => (
          <DesktopIcon
            key={icon.id}
            id={icon.id}
            label={icon.label}
            icon={icon.id === "recycle" && binItems.size > 0 ? "recycle_bin_full" : icon.icon}
            selected={selectedIcons.has(icon.id)}
            x={iconPositions[icon.id]?.x ?? DESKTOP_PADDING}
            y={iconPositions[icon.id]?.y ?? DESKTOP_PADDING}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              event.stopPropagation();
              suppressClickClear.current = false;
              setContextMenu(null);
              setStartOpen(false);
              setSelectedIcons(new Set([icon.id]));
              const position = iconPositions[icon.id] ?? { x: DESKTOP_PADDING, y: DESKTOP_PADDING };
              iconDrag.current = {
                id: icon.id,
                startX: event.clientX,
                startY: event.clientY,
                originX: position.x,
                originY: position.y,
                moved: false,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={moveIcon}
            onPointerUp={releaseIcon}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setSelectedIcons(new Set([icon.id]));
              setContextMenu({ x: event.clientX, y: event.clientY, target: icon.id });
            }}
          />
        ))}
      </div>

      <DesktopWindows
        windows={wm.windows}
        activeWindow={wm.activeWindow}
        commonProps={commonProps}
        renderWindow={renderWindow}
        winampDrag={winampDrag}
        setWinampDrag={setWinampDrag}
        focusWindow={wm.focusWindow}
        closeWindow={wm.closeWindow}
        minimizeWindow={wm.minimizeWindow}
        maximizeWindow={wm.maximizeWindow}
        moveWindow={wm.moveWindow}
        resizeWindow={wm.resizeWindow}
        playSound={playSound}
      />

      {startOpen && (
        <StartMenu
          onOpen={openWindow}
          onScreensaver={() => {
            setStartOpen(false);
            openWindow("screensaver");
          }}
          onShutdown={() => {
            setStartOpen(false);
            setShutdownOpen(true);
          }}
          onNotify={(message, options) => {
            setStartOpen(false);
            notify(message, options);
          }}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          onOpen={() => {
            const icon = desktopIcons.find((item) => item.id === contextMenu.target);
            if (icon?.windowId) {
              openWindow(icon.windowId, icon.payload);
            } else {
              notify(icon?.message ?? "Desktop properties are feeling nostalgic.");
            }
          }}
          onArrangeIcons={arrangeIcons}
          onLineUpIcons={lineUpIcons}
          onRefresh={refreshDesktop}
          onProperties={showProperties}
          onEmptyRecycleBin={emptyRecycleBin}
          onNotify={notify}
          onClose={() => setContextMenu(null)}
        />
      )}

      {notification &&
        (notification.balloon ? (
          <NotificationBalloon message={notification.message} bottomOffset={34} />
        ) : (
          <NotificationDialog
            message={notification.message}
            icon={notification.icon}
            titleIcon={notification.titleIcon}
            onClose={() => setNotification(null)}
          />
        ))}

      {showDialupHint && (
        <NotificationBalloon
          message="Not connected. Open Dial-Up Networking to connect to the Internet."
          bottomOffset={34}
        />
      )}

      <Taskbar
        windows={wm.windows}
        activeId={wm.activeWindow?.instanceId}
        startOpen={startOpen}
        internetConnected={dialupDone}
        muted={muted}
        volume={volume}
        onVolumeChange={setVolume}
        onStart={() => {
          setStartOpen((value) => !value);
          playSound("click");
        }}
        onTask={(instanceId) => wm.focusWindow(instanceId)}
        onDisconnectRequest={() => {
          setConnectionStatusOpen(true);
          playSound("click");
        }}
        onMcAfeeOpen={() => {
          setMcAfeeOpen(true);
          playSound("open");
        }}
        onToggleMute={() => setMuted((value) => !value)}
        onClockOpen={() => openWindow("datetime")}
        onQuickLaunch={handleQuickLaunch}
        onShowDesktop={handleShowDesktop}
      />

      {shutdownOpen && (
        <ShutDownOverlay
          safe={safeToTurnOff}
          onRestart={() => {
            playSound("shutdown");
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }}
          onShutdown={() => {
            playSound("shutdown");
            setSafeToTurnOff(true);
          }}
          onCancel={() => setShutdownOpen(false)}
        />
      )}

      {connectionStatusOpen && (
        <ConnectionStatusDialog
          connectedAt={connectedAt}
          onClose={() => setConnectionStatusOpen(false)}
          onDisconnect={() => {
            setDialupDone(false);
            setConnectedAt(null);
            setConnectionStatusOpen(false);
            notify("Disconnected from the Internet.", { balloon: true });
          }}
        />
      )}

      {mcAfeeOpen && (
        <McAfeePropertiesDialog
          onClose={() => {
            setMcAfeeOpen(false);
            playSound("close");
          }}
        />
      )}

      {screensaver.active && <ScreensaverOverlay mode={screensaver.mode} onExit={screensaver.stop} />}

      {crash && (
        <CrashSequence
          variant={crash.variant}
          message={crash.message}
          playSound={playSound}
          onReboot={() => window.location.reload()}
        />
      )}

      {errorPopup && (
        <Win98ErrorDialog
          title={errorPopup.title}
          message={errorPopup.message}
          onClose={() => setErrorPopup(null)}
        />
      )}

      {virusAlertOpen && (
        <McAfeeVirusAlert playSound={playSound} onClose={() => setVirusAlertOpen(false)} />
      )}

      {isSafeMode && (
        <>
          <div className="fixed top-1 left-2 text-[#ffff00] font-bold text-[12px] font-mono pointer-events-none z-9999">Safe Mode</div>
          <div className="fixed top-1 right-2 text-[#ffff00] font-bold text-[12px] font-mono pointer-events-none z-9999">Safe Mode</div>
          <div className="fixed bottom-[30px] left-2 text-[#ffff00] font-bold text-[12px] font-mono pointer-events-none z-9999">Safe Mode</div>
          <div className="fixed bottom-[30px] right-2 text-[#ffff00] font-bold text-[12px] font-mono pointer-events-none z-9999">Safe Mode</div>
        </>
      )}
    </main>
  );
}

function McAfeePropertiesDialog({ onClose }: { onClose: () => void }) {
  const navItems = [
    "System Scan",
    "E-Mail Scan",
    "Download Scan",
    "Internet Filter",
    "Security",
  ];

  return (
    <div className="fixed inset-0 z-[7300] flex items-center justify-center" onClick={onClose}>
      <div
        className="w-[468px] bg-[#c0c0c0] p-[3px]"
        style={{
          boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-[18px] items-center justify-between bg-gradient-to-r from-[#000080] to-[#1084d0] px-[4px]">
          <span className="text-[11px] font-bold text-white">McAffee Virus Scan</span>
          <div className="flex gap-[2px]">
            <button className="win-button flex h-[13px] w-[15px] items-center justify-center p-0 text-[9px] leading-none" style={{ minHeight: 0 }}>?</button>
            <button className="win-button flex h-[13px] w-[15px] items-center justify-center p-0 text-[9px] leading-none" style={{ minHeight: 0 }} onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="flex gap-[8px] p-[8px] pb-[6px]">
          <aside
            className="flex w-[90px] shrink-0 flex-col items-center gap-[8px] bg-white p-[6px]"
            style={{ boxShadow: "inset -1px -1px #ffffff, inset 1px 1px #0a0a0a" }}
          >
            {navItems.map((item) => (
              <button
                key={item}
                className={`flex w-full flex-col items-center gap-[2px] px-[2px] py-[1px] text-center text-[11px] ${
                  item === "Download Scan" ? "bg-[#c0c0c0]" : ""
                }`}
              >
                <img src="/icons/McAfee.png" alt="" width={32} height={32} draggable={false} style={{ imageRendering: "pixelated" }} />
                <span>{item}</span>
              </button>
            ))}
          </aside>

          <section className="min-w-0 flex-1">
            <div className="flex h-[24px] items-center px-[2px]">
              <span className="text-[13px] font-bold">McAfee 4.0</span>
            </div>
            <div
              className="min-h-[330px] bg-[#c0c0c0] p-[10px]"
              style={{ boxShadow: "inset -1px -1px #404040, inset 1px 1px #ffffff" }}
            >
              <div className="mb-[12px] flex items-start gap-[10px]">
                <img src="/icons/McAfee.png" alt="" width={38} height={38} draggable={false} style={{ imageRendering: "pixelated" }} />
                <p className="text-[11px] leading-[14px]">
                  Enable scanning of files downloaded from the Internet, and specify the types of files to scan.
                  Right click on &quot;Program files only&quot; for more information.
                </p>
              </div>

              <label className="mb-[8px] flex items-center gap-[6px] text-[11px]">
                <input type="checkbox" checked readOnly />
                <span>Enable Internet download scanning</span>
              </label>

              <fieldset className="min-h-[235px] border border-[#808080] px-[10px] pb-[10px] pt-[8px]">
                <legend className="px-[4px]">What to scan</legend>
                <label className="mb-[7px] flex items-center gap-[6px] text-[11px]">
                  <input type="radio" checked readOnly />
                  <span>All files</span>
                </label>
                <div className="mb-[12px] flex items-center gap-[8px]">
                  <label className="flex items-center gap-[6px] text-[11px]">
                    <input type="radio" readOnly />
                    <span>Program files only</span>
                  </label>
                  <button className="win-button min-w-[72px] text-[#808080]">Extensions...</button>
                </div>
                <label className="flex items-center gap-[6px] text-[11px]">
                  <input type="checkbox" checked readOnly />
                  <span>Scan compressed files</span>
                </label>
                <div className="mt-[102px] flex justify-end">
                  <button className="win-button min-w-[74px]">Advanced...</button>
                </div>
              </fieldset>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between px-[8px] pb-[8px]">
          <button className="win-button min-w-[88px]">Wizard...</button>
          <div className="flex gap-[6px]">
            <button className="win-button min-w-[74px]" onClick={onClose}>OK</button>
            <button className="win-button min-w-[74px]" onClick={onClose}>Cancel</button>
            <button className="win-button min-w-[74px]">Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopWindows({
  windows,
  activeWindow,
  commonProps,
  renderWindow,
  winampDrag,
  setWinampDrag,
  focusWindow,
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  moveWindow,
  resizeWindow,
  playSound,
}: {
  windows: DesktopWindow[];
  activeWindow?: DesktopWindow;
  commonProps: Omit<WindowComponentProps, "window">;
  renderWindow: (props: WindowComponentProps) => ReactNode;
  winampDrag: WindowDrag;
  setWinampDrag: Dispatch<SetStateAction<WindowDrag>>;
  focusWindow: (instanceId: string) => void;
  closeWindow: (instanceId: string) => void;
  minimizeWindow: (instanceId: string) => void;
  maximizeWindow: (instanceId: string) => void;
  moveWindow: (instanceId: string, x: number, y: number) => void;
  resizeWindow: (instanceId: string, width: number, height: number) => void;
  playSound: (sound: string) => void;
}) {
  return windows.map((item) => {
    if (item.id === "music") {
      return (
        <div
          key={item.instanceId}
          className={`fixed ${item.minimized ? "hidden" : ""}`}
          style={{
            left: item.maximized ? 0 : item.x,
            top: item.maximized ? 0 : item.y,
            zIndex: item.zIndex,
          }}
          onPointerDown={() => focusWindow(item.instanceId)}
          onPointerMove={(event) => {
            if (!winampDrag) return;
            moveWindow(
              winampDrag.instanceId,
              event.clientX - winampDrag.dx,
              event.clientY - winampDrag.dy,
            );
          }}
          onPointerUp={() => setWinampDrag(null)}
        >
          <div
            className="relative touch-none"
            onPointerDown={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest("button,input")) return;
              if (!target.closest(".winamp-titlebar,.winamp-eq-titlebar,.winamp-pl-titlebar")) return;
              event.stopPropagation();
              focusWindow(item.instanceId);
              setWinampDrag({
                instanceId: item.instanceId,
                dx: event.clientX - item.x,
                dy: event.clientY - item.y,
              });
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
          >
            {renderWindow({ window: item, ...commonProps })}
          </div>
        </div>
      );
    }

    return (
      <WindowFrame
        key={item.instanceId}
        window={item}
        active={activeWindow?.instanceId === item.instanceId}
        onFocus={() => focusWindow(item.instanceId)}
        onClose={() => {
          closeWindow(item.instanceId);
          playSound("close");
        }}
        onMinimize={() => minimizeWindow(item.instanceId)}
        onMaximize={() => maximizeWindow(item.instanceId)}
        onMove={(x, y) => moveWindow(item.instanceId, x, y)}
        onResize={(width, height) => resizeWindow(item.instanceId, width, height)}
      >
        <WindowActivity value={{ active: activeWindow?.instanceId === item.instanceId, visible: !item.minimized }}>
          {renderWindow({ window: item, ...commonProps })}
        </WindowActivity>
      </WindowFrame>
    );
  });
}

function ConnectionStatusDialog({
  connectedAt,
  onClose,
  onDisconnect,
}: {
  connectedAt: number | null;
  onClose: () => void;
  onDisconnect: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const seconds = Math.max(0, Math.floor((now - (connectedAt ?? now)) / 1000));
  const duration = `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const sent = (12 + seconds * 0.7).toFixed(1);
  const received = (48 + seconds * 2.4).toFixed(1);

  return (
    <div className="fixed inset-0 z-[7200] flex items-center justify-center" onClick={onClose}>
      <div
        className="w-[360px] bg-[#c0c0c0] p-[3px]"
        style={{
          boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-[20px] items-center justify-between bg-gradient-to-r from-[#000080] to-[#1084d0] px-[2px] pl-[4px]">
          <span className="text-[11px] font-bold text-white">Internet Status</span>
          <button
            className="flex h-[16px] w-[16px] items-center justify-center"
            style={{
              background: "#c0c0c0",
              boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
            }}
            aria-label="Close"
            onClick={onClose}
          >
            <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
              <path d="M0 0L3 3.5L0 7H1L4 3.5L7 7H8L5 3.5L8 0H7L4 3.5L1 0H0Z" fill="#000" />
            </svg>
          </button>
        </div>
        <div className="flex gap-[12px] p-[14px]">
          <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center overflow-hidden">
            <img
              src="/icons/connection.png"
              alt=""
              width={32}
              height={32}
              draggable={false}
              className="block h-[32px] w-[32px] object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          </span>
          <div className="min-w-0 flex-1 text-[11px] leading-[15px]">
            <p className="mb-[8px] font-bold">Connected to the Internet</p>
            <div className="grid grid-cols-[88px_1fr] gap-x-2 gap-y-[3px]">
              <span>Speed:</span>
              <span>33.6 kbps</span>
              <span>Duration:</span>
              <span>{duration}</span>
              <span>Sent:</span>
              <span>{sent} KB</span>
              <span>Received:</span>
              <span>{received} KB</span>
            </div>
            <div className="mt-[10px] h-[12px] bg-white" style={{ boxShadow: "inset -1px -1px #ffffff, inset 1px 1px #808080" }}>
              <div className="h-full w-[64%] bg-[#000080]" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-[6px] px-[10px] pb-[10px]">
          <button className="win-button min-w-[82px] font-bold" onClick={onDisconnect}>
            Disconnect
          </button>
          <button className="win-button min-w-[70px]" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
