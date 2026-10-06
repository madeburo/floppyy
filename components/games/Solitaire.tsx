"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameMenuBar, GameStatusBar } from "./GameChrome";
import { FloppyyIcon } from "@/components/desktop/FloppyyIcon";
import { solitaireLayout } from "@/lib/games/solitaireLayout";
import { useWindowActivity } from "@/components/windows/WindowActivity";

const CARD_W = 71;
const CARD_H = 96;
const TOP_Y = 14;
const TABLEAU_Y = TOP_Y + CARD_H + 16;
const FACE_DOWN_OFFSET = 5;
const FACE_UP_OFFSET = 19;

const SUIT_GLYPHS = ["\u2663", "\u2666", "\u2665", "\u2660"]; // clubs, diamonds, hearts, spades
const RANK_LABELS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// cards.png row 4 (y = -384) holds the 12 card-back designs in columns 1..12.
// Column 1 is the classic red robot. A random back is picked for each new deal.
const BACK_ROW_Y = 384;
const BACK_COUNT = 12;
const SOLITAIRE_RECORD_KEY = "floppyy-solitaire-record";
const randomBack = () => Math.floor(Math.random() * BACK_COUNT) + 1;

type Card = {
  id: string;
  suit: number; // 0 clubs, 1 diamonds, 2 hearts, 3 spades
  rank: number; // 1..13
  faceUp: boolean;
};

type PileKind = "stock" | "waste" | "foundation" | "tableau";
type DragSource = { kind: PileKind; pile: number; index: number };

type GameState = {
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
};

type SolitaireRecord = {
  score: number;
  seconds: number;
  wonAt: string;
};

function readRecord(): SolitaireRecord | null {
  try {
    const saved = globalThis.localStorage.getItem(SOLITAIRE_RECORD_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as SolitaireRecord;
    if (typeof parsed.score !== "number" || typeof parsed.seconds !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

const isRed = (suit: number) => suit === 1 || suit === 2;
const oppositeColor = (a: Card, b: Card) => isRed(a.suit) !== isRed(b.suit);

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (let suit = 0; suit < 4; suit++) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: `${suit}-${rank}`, suit, rank, faceUp: false });
    }
  }
  return deck;
}

function shuffle(deck: Card[]): Card[] {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function deal(): GameState {
  const deck = shuffle(buildDeck());
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let pointer = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck[pointer++];
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }
  const stock = deck.slice(pointer).map((card) => ({ ...card, faceUp: false }));
  return { stock, waste: [], foundations: [[], [], [], []], tableau };
}

export function Solitaire({ playSound, onExit }: { playSound: (name: string) => void; onExit?: () => void }) {
  const { active } = useWindowActivity();
  const tableRef = useRef<HTMLDivElement>(null);
  const [tableSize, setTableSize] = useState({ width: 577, height: 420 });
  useEffect(() => {
    const element = tableRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setTableSize({ width: element.clientWidth, height: element.clientHeight }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [game, setGame] = useState<GameState>(() => deal());
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [backIndex, setBackIndex] = useState<number>(() => randomBack());
  const [showAbout, setShowAbout] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [record, setRecord] = useState<SolitaireRecord | null>(readRecord);
  const dragRef = useRef<DragSource | null>(null);
  // Click-to-move selection (works alongside drag-and-drop, and on touch).
  const [selected, setSelected] = useState<DragSource | null>(null);

  const newGame = useCallback(() => {
    setGame(deal());
    setScore(0);
    setSeconds(0);
    setStarted(false);
    setWon(false);
    setSelected(null);
    setBackIndex(randomBack());
    playSound("click");
  }, [playSound]);

  // Timer
  useEffect(() => {
    if (!started || won || !active) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active, started, won]);

  const begin = useCallback(() => {
    setStarted(true);
  }, []);

  const checkWin = useCallback((state: GameState) => {
    if (state.foundations.every((pile) => pile.length === 13)) {
      setWon(true);
      playSound("click");
    }
  }, [playSound]);

  useEffect(() => {
    if (!won) return;
    const timer = window.setTimeout(() => {
      setRecord((current) => {
        if (current && (current.score > score || (current.score === score && current.seconds <= seconds))) return current;
        const next = { score, seconds, wonAt: new Date().toISOString() };
        try {
          globalThis.localStorage.setItem(SOLITAIRE_RECORD_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [won, score, seconds]);

  // Draw from stock to waste (draw one), recycle when empty
  const drawStock = useCallback(() => {
    begin();
    setSelected(null);
    playSound("click");
    setGame((prev) => {
      if (prev.stock.length === 0) {
        if (prev.waste.length === 0) return prev;
        const stock = [...prev.waste].reverse().map((c) => ({ ...c, faceUp: false }));
        return { ...prev, stock, waste: [] };
      }
      const stock = [...prev.stock];
      const card = stock.pop()!;
      return { ...prev, stock, waste: [...prev.waste, { ...card, faceUp: true }] };
    });
  }, [begin, playSound]);

  const cardsFromSource = (state: GameState, src: DragSource): Card[] => {
    if (src.kind === "waste") return state.waste.slice(-1);
    if (src.kind === "foundation") return state.foundations[src.pile].slice(-1);
    if (src.kind === "tableau") return state.tableau[src.pile].slice(src.index);
    return [];
  };

  const removeFromSource = (state: GameState, src: DragSource, count: number): GameState => {
    const next = {
      stock: state.stock,
      waste: [...state.waste],
      foundations: state.foundations.map((p) => [...p]),
      tableau: state.tableau.map((p) => [...p]),
    };
    if (src.kind === "waste") next.waste.splice(-count, count);
    else if (src.kind === "foundation") next.foundations[src.pile].splice(-count, count);
    else if (src.kind === "tableau") {
      next.tableau[src.pile].splice(next.tableau[src.pile].length - count, count);
      const col = next.tableau[src.pile];
      if (col.length && !col[col.length - 1].faceUp) {
        col[col.length - 1] = { ...col[col.length - 1], faceUp: true };
      }
    }
    return next;
  };

  const canDropTableau = (target: Card[], moving: Card[]) => {
    const first = moving[0];
    if (target.length === 0) return first.rank === 13;
    const top = target[target.length - 1];
    return top.faceUp && oppositeColor(top, first) && top.rank === first.rank + 1;
  };

  const canDropFoundation = (target: Card[], moving: Card[]) => {
    if (moving.length !== 1) return false;
    const card = moving[0];
    if (target.length === 0) return card.rank === 1;
    const top = target[target.length - 1];
    return top.suit === card.suit && top.rank === card.rank - 1;
  };

  const performMove = useCallback(
    (src: DragSource, dest: { kind: "tableau" | "foundation"; pile: number }) => {
      setGame((prev) => {
        const moving = cardsFromSource(prev, src);
        if (moving.length === 0) return prev;
        if (src.kind === dest.kind && src.pile === dest.pile) return prev;

        if (dest.kind === "tableau") {
          if (!canDropTableau(prev.tableau[dest.pile], moving)) return prev;
          const next = removeFromSource(prev, src, moving.length);
          next.tableau[dest.pile] = [...next.tableau[dest.pile], ...moving.map((c) => ({ ...c, faceUp: true }))];
          let delta = 0;
          if (src.kind === "waste") delta = 5;
          if (src.kind === "foundation") delta = -15;
          setScore((v) => Math.max(0, v + delta));
          playSound("click");
          return next;
        }

        // foundation
        if (!canDropFoundation(prev.foundations[dest.pile], moving)) return prev;
        const next = removeFromSource(prev, src, 1);
        next.foundations[dest.pile] = [...next.foundations[dest.pile], { ...moving[0], faceUp: true }];
        setScore((v) => v + 10);
        playSound("click");
        checkWin(next);
        return next;
      });
    },
    [checkWin, playSound],
  );

  const tryDrop = useCallback(
    (dest: { kind: "tableau" | "foundation"; pile: number }) => {
      const src = dragRef.current;
      dragRef.current = null;
      if (!src) return;
      performMove(src, dest);
    },
    [performMove],
  );

  // ===== Click-to-move =====
  // Returns true if `selected` can legally move onto the given destination pile.
  const canMoveTo = useCallback(
    (src: DragSource, dest: { kind: "tableau" | "foundation"; pile: number }) => {
      if (src.kind === dest.kind && src.pile === dest.pile) return false;
      const moving = cardsFromSource(game, src);
      if (moving.length === 0) return false;
      return dest.kind === "tableau"
        ? canDropTableau(game.tableau[dest.pile], moving)
        : canDropFoundation(game.foundations[dest.pile], moving);
    },
    [game],
  );

  // Click a card: place the current selection here if legal, otherwise (re)select it.
  const handleCardClick = useCallback(
    (src: DragSource) => {
      begin();
      if (selected && (src.kind === "tableau" || src.kind === "foundation")) {
        if (selected.kind === src.kind && selected.pile === src.pile) {
          setSelected(null);
          return;
        }
        if (canMoveTo(selected, { kind: src.kind, pile: src.pile })) {
          performMove(selected, { kind: src.kind, pile: src.pile });
          setSelected(null);
          return;
        }
      }
      // toggle selection
      setSelected((curr) =>
        curr && curr.kind === src.kind && curr.pile === src.pile && curr.index === src.index ? null : src,
      );
    },
    [begin, selected, canMoveTo, performMove],
  );

  // Click a pile background / empty slot: drop the selection there if legal.
  const handlePileClick = useCallback(
    (dest: { kind: "tableau" | "foundation"; pile: number }) => {
      if (!selected) return;
      if (canMoveTo(selected, dest)) performMove(selected, dest);
      setSelected(null);
    },
    [selected, canMoveTo, performMove],
  );

  const isSelected = (kind: PileKind, pile: number, index: number) =>
    !!selected && selected.kind === kind && selected.pile === pile && index >= selected.index;

  // Double-click: auto-send a card to a valid foundation
  const autoToFoundation = useCallback(
    (src: DragSource) => {
      begin();
      setGame((prev) => {
        const moving = cardsFromSource(prev, src);
        if (moving.length !== 1) return prev;
        const card = moving[0];
        for (let f = 0; f < 4; f++) {
          const target = prev.foundations[f];
          const ok = target.length === 0 ? card.rank === 1 : target[target.length - 1].suit === card.suit && target[target.length - 1].rank === card.rank - 1;
          if (ok) {
            const next = removeFromSource(prev, src, 1);
            next.foundations[f] = [...next.foundations[f], { ...card, faceUp: true }];
            setScore((v) => v + 10);
            playSound("click");
            checkWin(next);
            return next;
          }
        }
        return prev;
      });
    },
    [begin, checkWin, playSound],
  );

  const handleDragStart = (src: DragSource) => {
    begin();
    dragRef.current = src;
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const { padding, gap, baseWidth, scale } = solitaireLayout(tableSize.width);
  const foundationX = (i: number) => padding + (3 + i) * (CARD_W + gap);
  const tableauX = (i: number) => padding + i * (CARD_W + gap);
  const contentHeight = TABLEAU_Y + CARD_H + 16 + Math.max(...game.tableau.map((pile) => pile.slice(0, -1).reduce((total, card) => total + (card.faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET), 0)));
  const tableHeight = Math.max(tableSize.height, contentHeight * scale);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#c0c0c0]">
      <GameMenuBar
        items={[
          {
            label: "Game",
            menu: [
              { label: "New Game", shortcut: "F2", onClick: newGame },
              { label: "Statistics...", separatorBefore: true, onClick: () => { setShowStats(true); playSound("click"); } },
              { label: "Exit", separatorBefore: true, onClick: () => (onExit ? onExit() : undefined) },
            ],
          },
          {
            label: "Help",
            menu: [
              { label: "Help Topics", onClick: () => playSound("click") },
              { label: "About Solitaire", separatorBefore: true, onClick: () => { playSound("click"); setShowAbout(true); } },
            ],
          },
        ]}
      />
      <div
        ref={tableRef}
        className="relative min-h-0 flex-1 overflow-auto"
        data-testid="solitaire-table"
        style={{
          background: "#008000",
          boxShadow: "inset 2px 2px #006000, inset -1px -1px #00a000",
        }}
      >
        <div style={{ position: "relative", width: baseWidth * scale, height: tableHeight }}>
        <div style={{ position: "absolute", width: baseWidth, height: tableHeight / scale, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {/* Stock */}
        <div
          className="absolute"
          style={{ left: padding, top: TOP_Y, width: CARD_W, height: CARD_H }}
          onClick={drawStock}
        >
          {game.stock.length > 0 ? (
            <CardBack backIndex={backIndex} />
          ) : (
            <EmptySlot recycle />
          )}
        </div>

        {/* Waste */}
        <div className="absolute" style={{ left: padding + CARD_W + gap, top: TOP_Y, width: CARD_W, height: CARD_H }}>
          {game.waste.length === 0 ? (
            <EmptySlot />
          ) : (
            <CardFace
              card={game.waste[game.waste.length - 1]}
              draggable
              selected={isSelected("waste", 0, game.waste.length - 1)}
              onClick={() => handleCardClick({ kind: "waste", pile: 0, index: game.waste.length - 1 })}
              onDragStart={() => handleDragStart({ kind: "waste", pile: 0, index: game.waste.length - 1 })}
              onDoubleClick={() => autoToFoundation({ kind: "waste", pile: 0, index: game.waste.length - 1 })}
            />
          )}
        </div>

        {/* Foundations */}
        {game.foundations.map((pile, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: foundationX(i), top: TOP_Y, width: CARD_W, height: CARD_H }}
            onDragOver={allowDrop}
            onDrop={() => tryDrop({ kind: "foundation", pile: i })}
            onClick={() => handlePileClick({ kind: "foundation", pile: i })}
          >
            {pile.length === 0 ? (
              <EmptySlot suit={i} />
            ) : (
              <CardFace
                card={pile[pile.length - 1]}
                draggable
                selected={isSelected("foundation", i, pile.length - 1)}
                onClick={() => handleCardClick({ kind: "foundation", pile: i, index: pile.length - 1 })}
                onDragStart={() => handleDragStart({ kind: "foundation", pile: i, index: pile.length - 1 })}
              />
            )}
          </div>
        ))}

        {/* Tableau */}
        {game.tableau.map((pile, col) => (
          <div
            key={col}
            className="absolute"
            style={{ left: tableauX(col), top: TABLEAU_Y, width: CARD_W, height: CARD_H + pile.slice(0, -1).reduce((height, card) => height + (card.faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET), 0) }}
            onDragOver={allowDrop}
            onDrop={() => tryDrop({ kind: "tableau", pile: col })}
            onClick={() => handlePileClick({ kind: "tableau", pile: col })}
          >
            {pile.length === 0 && <EmptySlot />}
            {pile.map((card, idx) => {
              const y = pile.slice(0, idx).reduce((acc, c) => acc + (c.faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET), 0);
              return (
                <div key={card.id} className="absolute left-0" style={{ top: y, zIndex: idx + 1 }}>
                  {card.faceUp ? (
                    <CardFace
                      card={card}
                      draggable
                      selected={isSelected("tableau", col, idx)}
                      onClick={() => handleCardClick({ kind: "tableau", pile: col, index: idx })}
                      onDragStart={() => handleDragStart({ kind: "tableau", pile: col, index: idx })}
                      onDoubleClick={() => idx === pile.length - 1 && autoToFoundation({ kind: "tableau", pile: col, index: idx })}
                    />
                  ) : (
                    <CardBack backIndex={backIndex} />
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {won && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="win-bevel bg-[#c0c0c0] px-[28px] py-[20px] text-center">
              <div className="mb-[10px] text-[16px] font-bold">You won!</div>
              <button className="win-button min-w-[96px]" onClick={newGame}>
                Deal again
              </button>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
      <GameStatusBar>
        Score: {score}
        {record && <span className="ml-[16px]">Best: {record.score}</span>}
        <span className="ml-auto">Time: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
      </GameStatusBar>

      {showAbout && <AboutSolitaireDialog onClose={() => setShowAbout(false)} />}
      {showStats && (
        <SolitaireStatsDialog
          record={record}
          onReset={() => {
            try {
              globalThis.localStorage.removeItem(SOLITAIRE_RECORD_KEY);
            } catch {
              /* ignore */
            }
            setRecord(null);
            playSound("click");
          }}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}

function SolitaireStatsDialog({
  record,
  onReset,
  onClose,
}: {
  record: SolitaireRecord | null;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-[9000] flex items-center justify-center bg-black/20" onPointerDown={onClose}>
      <div
        className="w-[300px] select-none bg-[#c0c0c0] text-black"
        style={{
          boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
          padding: 3,
        }}
        onPointerDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Solitaire Statistics"
      >
        <div className="flex h-[18px] items-center justify-between bg-gradient-to-r from-[#000080] to-[#1084d0] pl-[4px] pr-[2px]">
          <span className="truncate text-[11px] font-bold text-white">Solitaire Statistics</span>
          <button className="win-button h-[14px] w-[16px] min-w-0 p-0 text-[10px] leading-none" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>
        <div className="px-[16px] py-[14px] text-[11px] leading-[20px]">
          <div className="flex justify-between">
            <span>Best score:</span>
            <span>{record ? record.score : "0"}</span>
          </div>
          <div className="flex justify-between">
            <span>Best time:</span>
            <span>{record ? `${Math.floor(record.seconds / 60)}:${String(record.seconds % 60).padStart(2, "0")}` : "--:--"}</span>
          </div>
          <div className="flex justify-between">
            <span>Player:</span>
            <span>Floppyy User</span>
          </div>
        </div>
        <div className="flex justify-end gap-[8px] px-[16px] pb-[14px]">
          <button className="win-button min-w-[88px]" onClick={onReset}>Reset</button>
          <button className="win-button min-w-[72px]" onClick={onClose} autoFocus>OK</button>
        </div>
      </div>
    </div>
  );
}

function AboutSolitaireDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-[9000] flex items-center justify-center bg-black/20"
      onPointerDown={onClose}
    >
      <div
        className="w-[360px] select-none bg-[#c0c0c0] text-black"
        style={{
          boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
          padding: 3,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="About Solitaire"
      >
        {/* Title bar */}
        <div className="flex h-[18px] items-center justify-between bg-gradient-to-r from-[#000080] to-[#1084d0] pl-[4px] pr-[2px]">
          <span className="truncate text-[11px] font-bold text-white">About Solitaire</span>
          <button
            className="flex h-[14px] w-[16px] items-center justify-center text-[10px] leading-none text-black"
            style={{ background: "#c0c0c0", boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf" }}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex gap-[14px] px-[14px] pb-[10px] pt-[16px]">
          <FloppyyIcon type="cards" size={40} />
          <div className="text-[11px] leading-[16px]">
            <div>(R) Solitaire</div>
            <div>Windows 98</div>
            <div>Copyright (C) 1981-1998 Microsoft Corp.</div>
            <div>Developed for Microsoft by Wes Cherry</div>
          </div>
        </div>

        {/* Separator */}
        <div className="mx-[14px] my-[6px] h-px bg-[#808080] shadow-[0_1px_#fff]" />

        {/* System info */}
        <div className="px-[14px] pb-[14px] text-[11px] leading-[18px]">
          <div className="flex justify-between gap-[20px]">
            <span>Physical memory available to Windows:</span>
            <span>130,588 KB</span>
          </div>
          <div className="flex justify-between gap-[20px]">
            <span>System resources:</span>
            <span>94% Free</span>
          </div>
        </div>

        {/* OK button */}
        <div className="flex justify-end px-[14px] pb-[14px]">
          <button className="win-button min-w-[80px] text-[11px]" onClick={onClose} autoFocus>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function CardFace({
  card,
  draggable,
  selected,
  onClick,
  onDragStart,
  onDoubleClick,
}: {
  card: Card;
  draggable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onDragStart?: () => void;
  onDoubleClick?: () => void;
}) {
  return (
    <div
      draggable={draggable}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", card.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDoubleClick={onDoubleClick}
      aria-label={`${RANK_LABELS[card.rank]} of ${["clubs", "diamonds", "hearts", "spades"][card.suit]}`}
      role="img"
      className="select-none rounded-[5px] bg-white"
      style={{
        width: CARD_W,
        height: CARD_H,
        boxShadow: selected ? "0 0 0 2px #1e90ff, 0 0 6px #1e90ff" : "0 0 0 1px #808080",
        backgroundImage: "url('/game-assets/solitaire/cards.png')",
        backgroundPosition: `${-(card.rank - 1) * CARD_W}px ${-card.suit * CARD_H}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    />
  );
}

function CardBack({ backIndex }: { backIndex: number }) {
  return (
    <div
      aria-hidden="true"
      className="select-none rounded-[5px]"
      style={{
        width: CARD_W,
        height: CARD_H,
        boxShadow: "0 0 0 1px #808080",
        backgroundImage: "url('/game-assets/solitaire/cards.png')",
        backgroundPosition: `${-backIndex * CARD_W}px ${-BACK_ROW_Y}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    />
  );
}

function EmptySlot({ suit, recycle }: { suit?: number; recycle?: boolean }) {
  return (
    <div
      className="flex items-center justify-center rounded-[5px]"
      style={{ width: CARD_W, height: CARD_H, border: "2px solid #006000" }}
    >
      {typeof suit === "number" && (
        <span className="text-[30px] text-[#006000]">{SUIT_GLYPHS[suit]}</span>
      )}
      {recycle && <span className="text-[26px] text-[#006000]">{"\u21BA"}</span>}
    </div>
  );
}
