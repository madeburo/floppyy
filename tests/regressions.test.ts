import test from "node:test";
import assert from "node:assert/strict";
import { checkersMoves, checkersMovesForPiece, applyCheckersMove, type Piece } from "../lib/games/checkers";
import { solitaireLayout } from "../lib/games/solitaireLayout";
import { fitWindow, initialWindowSize } from "../lib/windowGeometry";
import { desktopIcons, windowDefinitions } from "../lib/windows";
import { commands } from "../lib/commands";
import { projects } from "../lib/projects";
import { mergeGuestbookMessages } from "../lib/guestbook/client";
import type { GuestbookMessage } from "../lib/guestbook/types";
import { GAME_REGISTRY } from "../lib/gameRegistry";

const emptyBoard = () => Array<Piece>(64).fill(null);
const message = (id: number): GuestbookMessage => ({ id, nick: "Test", body: `Message ${id}`, avatar: "face-smile", status: "online", color: 0, createdAt: "2026-10-06T00:00:00Z" });

test("checkers never captures an empty square", () => {
  const board = emptyBoard();
  board[42] = "r";
  assert.deepEqual(checkersMoves(board, "r"), [{ from: 42, to: 33 }, { from: 42, to: 35 }]);
  assert.deepEqual(checkersMovesForPiece(board, 42, true), []);
});

test("checkers makes real captures mandatory and preserves the source board", () => {
  const board = emptyBoard(); board[42] = "r"; board[33] = "b"; board[46] = "r";
  const moves = checkersMoves(board, "r");
  assert.deepEqual(moves, [{ from: 42, to: 24, capture: 33 }]);
  const next = applyCheckersMove(board, moves[0], "r");
  assert.equal(next[33], null); assert.equal(next[24], "r"); assert.equal(board[42], "r");
});

test("checkers supports chained captures, promotion, and blocked sides", () => {
  const board = emptyBoard(); board[42] = "r"; board[33] = "b"; board[17] = "b";
  const next = applyCheckersMove(board, checkersMoves(board, "r")[0], "r");
  assert.deepEqual(checkersMovesForPiece(next, 24, true), [{ from: 24, to: 10, capture: 17 }]);
  const crowned = applyCheckersMove(next, { from: 10, to: 1 }, "r");
  assert.equal(crowned[1], null); // Empty sources cannot create pieces.
  next[10] = "r";
  assert.equal(applyCheckersMove(next, { from: 10, to: 1 }, "r")[1], "R");
  const blocked = emptyBoard(); blocked[0] = "r";
  assert.deepEqual(checkersMoves(blocked, "r"), []);
});

for (const width of [290, 344, 360, 530, 768, 1440]) {
  test(`all seven Solitaire columns fit at table width ${width}`, () => {
    const layout = solitaireLayout(width);
    assert.ok(layout.baseWidth * layout.scale <= width + 0.001);
    const lastCardRight = (layout.padding + 6 * (71 + layout.gap) + 71) * layout.scale;
    assert.ok(lastCardRight <= width);
    assert.ok(layout.scale > 0 && layout.scale <= 1);
  });
}

for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1440, 900], [390, 300]]) {
  test(`restored windows and all app defaults fit ${width}x${height}`, () => {
    const viewport = { width, height };
    const wins = [fitWindow({ x: 1400, y: 800, width: 900, height: 700 }, viewport), ...Object.values(windowDefinitions).map((definition) => initialWindowSize(definition, viewport))];
    for (const win of wins) {
      assert.ok(win.x >= 8 && win.y >= 8);
      assert.ok(win.x + win.width <= width - 8);
      assert.ok(win.y + win.height <= height - 36);
    }
  });
}

test("Guest Book removes confirmed newest, historical, and final deletions", () => {
  const current = [message(1), message(2), message(3)];
  assert.deepEqual(mergeGuestbookMessages(current, [message(1), message(2)], [3]).map(m => m.id), [1, 2]);
  assert.deepEqual(mergeGuestbookMessages(current, [], [1, 2, 3]), []);
  assert.deepEqual(mergeGuestbookMessages(current, [message(3)], [1]).map(m => m.id), [2, 3]);
});

test("Guest Book paged and stale snapshots retain newer local posts", () => {
  assert.deepEqual(mergeGuestbookMessages([message(2), message(3)], [message(1), message(2)]).map(m => m.id), [1, 2, 3]);
});

test("game catalog has unique executable names and valid windows", () => {
  assert.equal(new Set(GAME_REGISTRY.map(game => game.id)).size, GAME_REGISTRY.length);
  for (const game of GAME_REGISTRY) { assert.ok(game.label.endsWith(".exe")); assert.ok(windowDefinitions[game.id]); }
});

test("retired support entries and GitHub project links are not exposed", () => {
  assert.equal("support" in windowDefinitions, false);
  assert.equal("support" in commands, false);
  assert.equal(desktopIcons.some(icon => icon.id === "support"), false);
  for (const project of projects) {
    assert.equal("github" in project, false);
    assert.equal(new URL(project.site).protocol, "https:");
  }
});

test("projects show UsageNow, Brewwery, and OpenModels in the requested order", () => {
  assert.deepEqual(projects.map(project => project.name), ["UsageNow", "Brewwery", "OpenModels"]);
  assert.deepEqual(projects.map(project => project.slug), ["usagenow", "brewwery", "openmodels"]);
  assert.equal(projects[0].site, "https://www.usagenow.com");
  assert.equal(projects[0].description, "AI coding usage tracker for macOS. Limits, resets, and activity for Codex, Claude, Gemini, Grok and more");
  assert.equal(projects[0].details, projects[0].description);
});
