"use client";

import { useEffect, useState } from "react";
import { Shell, useGameSession, cellOutset, type GameProps } from "./RetroGameShell";
import { checkersMoves, checkersMovesForPiece, applyCheckersMove, type Piece } from "@/lib/games/checkers";

export function CheckersGame({ playSound, onExit }: GameProps) {
  const session = useGameSession();
  const initial = () => Array.from({ length: 64 }, (_, i): Piece => {
    const row = Math.floor(i / 8);
    const dark = (row + i) % 2 === 1;
    if (!dark) return null;
    if (row < 3) return "b";
    if (row > 4) return "r";
    return null;
  });
  const [board, setBoard] = useState<Piece[]>(initial);
  const [turn, setTurn] = useState<"r" | "b">("r");
  const [selected, setSelected] = useState<number | null>(null);
  const [forcedFrom, setForcedFrom] = useState<number | null>(null);
  const white = board.filter((p) => p?.toLowerCase() === "r").length;
  const black = board.filter((p) => p?.toLowerCase() === "b").length;
  const legalWhiteMoves = forcedFrom === null ? checkersMoves(board, "r") : checkersMovesForPiece(board, forcedFrom, true);
  const finished = checkersMoves(board, turn).length === 0;
  const whiteMustCapture = legalWhiteMoves.some((item) => typeof item.capture === "number");
  const selectedMoves = selected === null ? [] : legalWhiteMoves.filter((item) => item.from === selected);
  const playablePieces = new Set(legalWhiteMoves.map((item) => item.from));
  const validTargets = new Set(selectedMoves.map((item) => item.to));
  const reset = () => { setBoard(initial()); setTurn("r"); setSelected(null); setForcedFrom(null); playSound("click"); };

  useEffect(() => {
    if (!session.playing || finished || turn !== "b" || white === 0 || black === 0) return;
    const timer = window.setTimeout(() => {
        let nextBoard = board;
        const moves = checkersMoves(nextBoard, "b");
        if (moves.length === 0) return;
        let move = moves[Math.floor(Math.random() * moves.length)];
        let jumped = false;

        while (move) {
          jumped = jumped || typeof move.capture === "number";
          const piece = nextBoard[move.from];
          nextBoard = applyCheckersMove(nextBoard, move, "b");
          const crowned = piece === "b" && nextBoard[move.to] === "B";
          const followUps = typeof move.capture === "number" && !crowned
            ? checkersMovesForPiece(nextBoard, move.to, true)
            : [];
          move = followUps[Math.floor(Math.random() * followUps.length)];
        }

        playSound(jumped ? "recycle" : "click");
        setBoard(nextBoard);
      setTurn("r");
      setSelected(null);
      setForcedFrom(null);
    }, 550);
    return () => window.clearTimeout(timer);
  }, [black, board, finished, playSound, session.playing, turn, white]);

  const move = (to: number) => {
    if (!session.playing || finished || turn !== "r") return;
    if (selected === null) {
      if (board[to]?.toLowerCase() === "r" && playablePieces.has(to) && (forcedFrom === null || forcedFrom === to)) {
        setSelected(to);
      }
      return;
    }
    const piece = board[selected];
    if (!piece || board[to]) { setSelected(null); return; }

    const valid = selectedMoves.find((item) => item.to === to);
    if (!valid) { setSelected(null); return; }
    const nextBoard = applyCheckersMove(board, valid, "r");
    const crowned = piece === "r" && nextBoard[to] === "R";
    const followUps = typeof valid.capture === "number" && !crowned
      ? checkersMovesForPiece(nextBoard, to, true)
      : [];
    setBoard(nextBoard);
    if (followUps.length > 0) {
      setForcedFrom(to);
      setSelected(to);
    } else {
      setTurn("b");
      setSelected(null);
      setForcedFrom(null);
    }
    playSound(typeof valid.capture === "number" ? "recycle" : "click");
  };

  const status = white === 0
    ? "Computer wins."
    : black === 0
      ? "White wins."
      : turn === "b"
        ? "Computer thinking..."
        : forcedFrom !== null
          ? "Keep jumping with the selected piece."
          : whiteMustCapture
            ? `White to move. Capture required. White ${white} / Black ${black}`
            : `White to move. White ${white} / Black ${black}`;

  return (
    <Shell title="Checkers" session={session} result={finished ? turn === "r" ? "Computer wins. Start a new game?" : "You won! Start a new game?" : undefined} score={white} best={black} onExit={onExit} onReset={reset} status={status}>
      <div className="grid w-full max-w-[306px] grid-cols-8 border border-[#808080]">
        {board.map((piece, index) => {
          const row = Math.floor(index / 8);
          const dark = (row + index) % 2 === 1;
          const canMove = turn === "r" && piece?.toLowerCase() === "r" && playablePieces.has(index) && (forcedFrom === null || forcedFrom === index);
          const canLand = validTargets.has(index);
          return (
            <button
              key={index}
              className="relative flex aspect-square min-w-0 items-center justify-center"
              aria-label={`Square ${index + 1}${piece ? `, ${piece.toLowerCase() === "r" ? "white" : "black"}${piece === piece.toUpperCase() ? " king" : " piece"}` : ""}`}
              style={{
                background: dark ? "#008080" : "#f0e6c0",
                outline: selected === index ? "2px solid #ffff00" : canMove ? "1px solid #ffff00" : "none",
              }}
              onClick={() => move(index)}
            >
              {canLand && <span className="absolute h-[12px] w-[12px] rounded-full bg-[#ffff00] opacity-80" />}
              {piece && <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-black text-[12px] font-bold" style={{ background: piece.toLowerCase() === "r" ? "#ffffff" : "#111111", color: piece.toLowerCase() === "r" ? "#000" : "#fff", boxShadow: cellOutset }}>{piece === piece.toUpperCase() ? "K" : ""}</span>}
            </button>
          );
        })}
      </div>
    </Shell>
  );
}
