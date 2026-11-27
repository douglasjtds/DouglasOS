import { describe, expect, it } from "vitest";
import type { Card, Rank, Suit } from "@/lib/games/cards";
import {
  SCORE,
  applyMove,
  autoComplete,
  autoCompleteStep,
  autoMoveToFoundation,
  canAutoComplete,
  canFlip,
  canMove,
  canRecycle,
  canUndo,
  clickStock,
  deal,
  draw,
  flip,
  foundationTargetFor,
  isWon,
  recycle,
  undo,
  type Column,
  type SolitaireState,
} from "./engine";

const c = (suit: Suit, rank: number): Card => ({ id: `${suit}-${rank}`, suit, rank: rank as Rank });
const col = (faceDown: Card[] = [], faceUp: Card[] = []): Column => ({ faceDown, faceUp });
const run = (suit: Suit, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => c(suit, from + i));

/** A hand-built state: empty everything unless overridden. */
function make(over: Partial<SolitaireState> = {}): SolitaireState {
  return {
    drawCount: 1,
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: Array.from({ length: 7 }, () => col()),
    score: 0,
    moves: 0,
    history: [],
    ...over,
  };
}

function withColumns(cols: Record<number, Column>, over: Partial<SolitaireState> = {}) {
  const tableau = Array.from({ length: 7 }, (_, i) => cols[i] ?? col());
  return make({ tableau, ...over });
}

describe("deal", () => {
  it("deals 1..7 cards per column with only the top face up, 24 in the stock", () => {
    const s = deal(42);
    s.tableau.forEach((column, i) => {
      expect(column.faceDown).toHaveLength(i);
      expect(column.faceUp).toHaveLength(1);
    });
    expect(s.stock).toHaveLength(24);
    expect(s.waste).toHaveLength(0);
    expect(s.foundations.every((f) => f.length === 0)).toBe(true);
    expect(s.score).toBe(0);
    expect(s.moves).toBe(0);
  });

  it("uses all 52 distinct cards", () => {
    const s = deal(7);
    const all = [...s.stock, ...s.tableau.flatMap((c) => [...c.faceDown, ...c.faceUp])];
    expect(new Set(all.map((c) => c.id)).size).toBe(52);
  });

  it("is deterministic per seed and varies across seeds", () => {
    expect(deal(123)).toEqual(deal(123));
    expect(deal(123).stock).not.toEqual(deal(124).stock);
  });

  it("keeps the draw count", () => {
    expect(deal(1, 3).drawCount).toBe(3);
    expect(deal(1).drawCount).toBe(1);
  });
});

describe("draw and recycle", () => {
  it("draw one moves the stock's top card to the waste", () => {
    const s = make({ stock: [c("spades", 2), c("hearts", 5)] });
    const next = draw(s);
    expect(next.waste).toEqual([c("hearts", 5)]);
    expect(next.stock).toEqual([c("spades", 2)]);
    expect(next.moves).toBe(1);
  });

  it("draw three turns three cards, the last turned on top", () => {
    const s = make({ drawCount: 3, stock: [c("clubs", 1), c("clubs", 2), c("clubs", 3), c("clubs", 4)] });
    const next = draw(s);
    expect(next.waste).toEqual([c("clubs", 4), c("clubs", 3), c("clubs", 2)]);
    expect(next.stock).toEqual([c("clubs", 1)]);
    // Fewer than three left: takes what remains.
    expect(draw(next).waste.at(-1)).toEqual(c("clubs", 1));
  });

  it("draw on an empty stock is a no-op", () => {
    const s = make({ waste: [c("clubs", 1)] });
    expect(draw(s)).toBe(s);
  });

  it("recycle turns the waste back into the stock in the original order", () => {
    const start = make({ stock: [c("clubs", 1), c("clubs", 2), c("clubs", 3)], score: 200 });
    let s = draw(draw(draw(start)));
    expect(canRecycle(s)).toBe(true);
    s = recycle(s);
    expect(s.stock).toEqual(start.stock);
    expect(s.waste).toEqual([]);
    expect(s.score).toBe(200 + SCORE.recycleDrawOne);
  });

  it("recycle penalty is -20 in draw three, and never drops below zero", () => {
    expect(recycle(make({ drawCount: 3, waste: [c("clubs", 1)], score: 50 })).score).toBe(30);
    expect(recycle(make({ waste: [c("clubs", 1)], score: 40 })).score).toBe(0);
  });

  it("recycle is illegal while the stock has cards or the waste is empty", () => {
    const a = make({ stock: [c("clubs", 1)], waste: [c("clubs", 2)] });
    const b = make();
    expect(recycle(a)).toBe(a);
    expect(recycle(b)).toBe(b);
  });

  it("clickStock draws, then recycles when the stock is empty", () => {
    let s = make({ stock: [c("clubs", 1)] });
    s = clickStock(s);
    expect(s.waste).toHaveLength(1);
    s = clickStock(s);
    expect(s.stock).toHaveLength(1);
    expect(s.waste).toHaveLength(0);
  });
});

describe("tableau moves", () => {
  it("builds down in alternating colors", () => {
    const s = withColumns({ 0: col([], [c("spades", 8)]), 1: col([], [c("hearts", 7)]), 2: col([], [c("clubs", 7)]) });
    expect(canMove(s, { from: { kind: "tableau", index: 1, start: 0 }, to: { kind: "tableau", index: 0 } })).toBe(true);
    // Same color.
    expect(canMove(s, { from: { kind: "tableau", index: 2, start: 0 }, to: { kind: "tableau", index: 0 } })).toBe(false);
    // Wrong rank direction.
    expect(canMove(s, { from: { kind: "tableau", index: 0, start: 0 }, to: { kind: "tableau", index: 1 } })).toBe(false);
  });

  it("moves a whole face-up run and reveals nothing automatically", () => {
    const s = withColumns({
      0: col([c("diamonds", 1)], [c("clubs", 9), c("hearts", 8), c("spades", 7)]),
      1: col([], [c("diamonds", 10)]),
    });
    const next = applyMove(s, { from: { kind: "tableau", index: 0, start: 0 }, to: { kind: "tableau", index: 1 } });
    expect(next.tableau[1].faceUp.map((x) => x.id)).toEqual(["diamonds-10", "clubs-9", "hearts-8", "spades-7"]);
    expect(next.tableau[0]).toEqual(col([c("diamonds", 1)], []));
    expect(next.score).toBe(0);
    expect(next.moves).toBe(1);
  });

  it("moves a partial run from the middle", () => {
    const s = withColumns({
      0: col([], [c("clubs", 9), c("hearts", 8), c("spades", 7)]),
      1: col([], [c("clubs", 9)]),
    });
    const next = applyMove(s, { from: { kind: "tableau", index: 0, start: 1 }, to: { kind: "tableau", index: 1 } });
    expect(next.tableau[0].faceUp).toEqual([c("clubs", 9)]);
    expect(next.tableau[1].faceUp).toHaveLength(3);
  });

  it("only a King (or a King-led run) may go to an empty column", () => {
    const s = withColumns({
      0: col([c("clubs", 2)], [c("hearts", 13), c("spades", 12)]),
      1: col([], [c("hearts", 12)]),
    });
    expect(canMove(s, { from: { kind: "tableau", index: 0, start: 0 }, to: { kind: "tableau", index: 3 } })).toBe(true);
    expect(canMove(s, { from: { kind: "tableau", index: 0, start: 1 }, to: { kind: "tableau", index: 3 } })).toBe(false);
    expect(canMove(s, { from: { kind: "tableau", index: 1, start: 0 }, to: { kind: "tableau", index: 3 } })).toBe(false);
  });

  it("a column with only face-down cards is not empty", () => {
    const s = withColumns({ 0: col([c("clubs", 2)], []), 1: col([], [c("hearts", 13)]) });
    expect(canMove(s, { from: { kind: "tableau", index: 1, start: 0 }, to: { kind: "tableau", index: 0 } })).toBe(false);
  });

  it("rejects bad sources and moves onto the same column", () => {
    const s = withColumns({ 0: col([], [c("hearts", 13)]) });
    expect(canMove(s, { from: { kind: "tableau", index: 0, start: 0 }, to: { kind: "tableau", index: 0 } })).toBe(false);
    expect(canMove(s, { from: { kind: "tableau", index: 0, start: 3 }, to: { kind: "tableau", index: 1 } })).toBe(false);
    expect(canMove(s, { from: { kind: "waste" }, to: { kind: "tableau", index: 1 } })).toBe(false);
    const illegal = applyMove(s, { from: { kind: "tableau", index: 0, start: 1 }, to: { kind: "tableau", index: 1 } });
    expect(illegal).toBe(s);
  });

  it("waste → tableau scores +5", () => {
    const s = withColumns({ 0: col([], [c("spades", 8)]) }, { waste: [c("hearts", 7)] });
    const next = applyMove(s, { from: { kind: "waste" }, to: { kind: "tableau", index: 0 } });
    expect(next.waste).toEqual([]);
    expect(next.score).toBe(SCORE.wasteToTableau);
  });
});

describe("foundations", () => {
  it("accept an Ace on any empty pile, then the same suit upwards", () => {
    const s = make({ waste: [c("hearts", 1)] });
    const a = applyMove(s, { from: { kind: "waste" }, to: { kind: "foundation", index: 2 } });
    expect(a.foundations[2]).toEqual([c("hearts", 1)]);
    expect(a.score).toBe(SCORE.wasteToFoundation);

    const b = withColumns({ 0: col([], [c("hearts", 2)]), 1: col([], [c("spades", 2)]) }, { foundations: a.foundations });
    expect(canMove(b, { from: { kind: "tableau", index: 1, start: 0 }, to: { kind: "foundation", index: 2 } })).toBe(false);
    const next = applyMove(b, { from: { kind: "tableau", index: 0, start: 0 }, to: { kind: "foundation", index: 2 } });
    expect(next.foundations[2]).toHaveLength(2);
    expect(next.score).toBe(SCORE.tableauToFoundation);
  });

  it("reject non-Aces on empty piles and runs of more than one card", () => {
    const s = withColumns({ 0: col([], [c("hearts", 2), c("spades", 1)]) });
    expect(canMove(s, { from: { kind: "tableau", index: 0, start: 0 }, to: { kind: "foundation", index: 0 } })).toBe(false);
    expect(canMove(s, { from: { kind: "tableau", index: 0, start: 1 }, to: { kind: "foundation", index: 0 } })).toBe(true);
  });

  it("foundation → tableau costs 15 points (never below zero)", () => {
    const s = withColumns({ 0: col([], [c("spades", 3)]) }, { foundations: [run("hearts", 1, 2), [], [], []], score: 20 });
    const next = applyMove(s, { from: { kind: "foundation", index: 0 }, to: { kind: "tableau", index: 0 } });
    expect(next.tableau[0].faceUp.at(-1)).toEqual(c("hearts", 2));
    expect(next.score).toBe(5);
    expect(applyMove({ ...s, score: 3 }, { from: { kind: "foundation", index: 0 }, to: { kind: "tableau", index: 0 } }).score).toBe(0);
  });

  it("foundation → another foundation is not allowed to the same pile", () => {
    const s = make({ foundations: [[c("hearts", 1)], [], [], []] });
    expect(canMove(s, { from: { kind: "foundation", index: 0 }, to: { kind: "foundation", index: 0 } })).toBe(false);
  });
});

describe("flip", () => {
  it("turns over a face-down top card for +5", () => {
    const s = withColumns({ 0: col([c("clubs", 4), c("hearts", 9)], []) });
    expect(canFlip(s, 0)).toBe(true);
    const next = flip(s, 0);
    expect(next.tableau[0]).toEqual(col([c("clubs", 4)], [c("hearts", 9)]));
    expect(next.score).toBe(SCORE.flip);
    expect(next.moves).toBe(1);
  });

  it("is illegal while face-up cards cover the column, or on an empty column", () => {
    const s = withColumns({ 0: col([c("clubs", 4)], [c("hearts", 9)]) });
    expect(canFlip(s, 0)).toBe(false);
    expect(flip(s, 0)).toBe(s);
    expect(flip(s, 1)).toBe(s);
  });
});

describe("autoMoveToFoundation", () => {
  it("sends the waste top or a column top to a fitting foundation", () => {
    const s = withColumns({ 0: col([], [c("spades", 9), c("clubs", 1)]) }, { waste: [c("hearts", 1)] });
    const a = autoMoveToFoundation(s, { kind: "waste" });
    expect(a.foundations[0]).toEqual([c("hearts", 1)]);
    const b = autoMoveToFoundation(a, { kind: "tableau", index: 0, start: 1 });
    expect(b.foundations[1]).toEqual([c("clubs", 1)]);
  });

  it("only applies to the top card of a column and does nothing when no pile fits", () => {
    const s = withColumns({ 0: col([], [c("spades", 1), c("hearts", 5)]) });
    expect(foundationTargetFor(s, { kind: "tableau", index: 0, start: 0 })).toBeNull();
    expect(autoMoveToFoundation(s, { kind: "tableau", index: 0, start: 1 })).toBe(s);
    expect(foundationTargetFor(s, { kind: "foundation", index: 0 })).toBeNull();
  });

  it("prefers the pile already holding the suit", () => {
    const s = withColumns({ 0: col([], [c("hearts", 2)]) }, { foundations: [[], [], [c("hearts", 1)], []] });
    expect(foundationTargetFor(s, { kind: "tableau", index: 0, start: 0 })).toEqual({ kind: "foundation", index: 2 });
  });
});

describe("auto-complete and win", () => {
  /** Every card face up in the tableau: one suit per column, King at the bottom. */
  function allFaceUp(): SolitaireState {
    return withColumns({
      0: col([], run("spades", 1, 13).reverse()),
      1: col([], run("hearts", 1, 13).reverse()),
      2: col([], run("diamonds", 1, 13).reverse()),
      3: col([], run("clubs", 1, 13).reverse()),
    });
  }

  it("is offered only when stock and waste are empty and nothing is face down", () => {
    expect(canAutoComplete(allFaceUp())).toBe(true);
    expect(canAutoComplete({ ...allFaceUp(), stock: [c("clubs", 1)] })).toBe(false);
    expect(canAutoComplete({ ...allFaceUp(), waste: [c("clubs", 1)] })).toBe(false);
    expect(canAutoComplete(withColumns({ 0: col([c("clubs", 1)], [c("hearts", 2)]) }))).toBe(false);
    expect(canAutoComplete(deal(3))).toBe(false);
  });

  it("steps one lowest card at a time and finishes the game", () => {
    const s = allFaceUp();
    const step = autoCompleteStep(s);
    expect(step.foundations.flat()).toHaveLength(1);
    expect(step.foundations.flat()[0].rank).toBe(1);
    const done = autoComplete(s);
    expect(isWon(done)).toBe(true);
    expect(canAutoComplete(done)).toBe(false);
    expect(done.score).toBe(52 * SCORE.tableauToFoundation);
    expect(done.moves).toBe(52);
  });

  it("isWon needs 13 cards on every foundation", () => {
    expect(isWon(make())).toBe(false);
    const full = ["spades", "hearts", "diamonds", "clubs"].map((s) => run(s as Suit, 1, 13));
    expect(isWon(make({ foundations: full }))).toBe(true);
  });
});

describe("undo", () => {
  it("restores the board, score and move count step by step", () => {
    const s0 = withColumns({ 0: col([c("clubs", 4)], [c("spades", 8)]) }, { waste: [c("hearts", 7)], stock: [c("clubs", 1)] });
    const s1 = applyMove(s0, { from: { kind: "waste" }, to: { kind: "tableau", index: 0 } });
    const s2 = draw(s1);
    expect(canUndo(s2)).toBe(true);
    const u1 = undo(s2);
    expect(u1).toEqual(s1);
    const u0 = undo(u1);
    expect(u0).toEqual(s0);
    expect(canUndo(u0)).toBe(false);
    expect(undo(u0)).toBe(u0);
  });

  it("undoes a recycle penalty and a flip", () => {
    const s0 = withColumns({ 0: col([c("clubs", 4)], []) }, { waste: [c("hearts", 7)], score: 150 });
    const s1 = flip(recycle(s0), 0);
    expect(s1.score).toBe(150 - 100 + 5);
    expect(undo(undo(s1))).toEqual(s0);
  });
});
