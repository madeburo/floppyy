export type Piece = "r" | "b" | "R" | "B" | null;
export type CheckersSide = "r" | "b";
export type CheckersMove = { from: number; to: number; capture?: number };

export function checkersDirections(piece: Piece): [number, number][] {
  if (!piece) return [];
  if (piece === "R" || piece === "B") return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return piece === "r" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

export function checkersMoves(board: Piece[], side: CheckersSide): CheckersMove[] {
  const moves = checkersMovesForSide(board, side, false);
  const captures = checkersMovesForSide(board, side, true);
  return captures.length ? captures : moves;
}

export function checkersMovesForSide(board: Piece[], side: CheckersSide, capturesOnly: boolean): CheckersMove[] {
  const out: CheckersMove[] = [];

  board.forEach((piece, from) => {
    if (!piece || piece.toLowerCase() !== side) return;
    out.push(...checkersMovesForPiece(board, from, capturesOnly));
  });

  return out;
}

export function checkersMovesForPiece(board: Piece[], from: number, capturesOnly: boolean): CheckersMove[] {
  const piece = board[from];
  if (!piece) return [];
  const side = piece.toLowerCase() as CheckersSide;
  const row = Math.floor(from / 8);
  const col = from % 8;
  const moves: CheckersMove[] = [];

  for (const [dr, dc] of checkersDirections(piece)) {
    const nextRow = row + dr;
    const nextCol = col + dc;
    if (nextRow < 0 || nextRow > 7 || nextCol < 0 || nextCol > 7) continue;
    const next = nextRow * 8 + nextCol;

    if (!capturesOnly && !board[next]) {
      moves.push({ from, to: next });
      continue;
    }

    const jumpRow = row + dr * 2;
    const jumpCol = col + dc * 2;
    if (jumpRow < 0 || jumpRow > 7 || jumpCol < 0 || jumpCol > 7) continue;
    const jump = jumpRow * 8 + jumpCol;
    if (board[next] && board[next].toLowerCase() !== side && !board[jump]) {
      moves.push({ from, to: jump, capture: next });
    }
  }

  return moves;
}

export function applyCheckersMove(board: Piece[], move: CheckersMove, side: CheckersSide): Piece[] {
  const piece = board[move.from];
  if (!piece) return board;
  const next = [...board];
  const targetRow = Math.floor(move.to / 8);
  next[move.from] = null;
  if (typeof move.capture === "number") next[move.capture] = null;
  next[move.to] = (side === "r" && targetRow === 0) || (side === "b" && targetRow === 7)
    ? side.toUpperCase() as Piece
    : piece;
  return next;
}
