import { describe, expect, it } from "vitest";
import { SUITS, type Card, type Rank, type Suit } from "@/lib/games/cards";
import {
  applyMove,
  autoMoves,
  canUndo,
  cardsLeft,
  deal,
  hasLegalMoves,
  isLegalMove,
  isSafeAutoMove,
  isValidGameNumber,
  isWon,
  maxMovable,
  newGame,
  play,
  quickMove,
  randomGameNumber,
  resolveMove,
  restart,
  runLength,
  undo,
  type FreeCellState,
  type Location,
} from "@/lib/games/freecell/engine";
import { createRng } from "@/lib/games/rng";

const c = (suit: Suit, rank: number): Card => ({ id: `${suit}-${rank}`, suit, rank: rank as Rank });
const col = (index: number): Location => ({ kind: "column", index });
const cell = (index: number): Location => ({ kind: "free", index });
const found = (index = 0): Location => ({ kind: "foundation", index });

/** Foundation piles up to the given rank per suit. */
function foundationsUpTo(ranks: Partial<Record<Suit, number>>): Card[][] {
  return SUITS.map((suit) => Array.from({ length: ranks[suit] ?? 0 }, (_, i) => c(suit, i + 1)));
}

function makeState({
  columns = [],
  freeCells = [],
  foundations = {},
}: {
  columns?: Card[][];
  freeCells?: (Card | null)[];
  foundations?: Partial<Record<Suit, number>>;
}): FreeCellState {
  return {
    gameNumber: 1,
    columns: Array.from({ length: 8 }, (_, i) => columns[i] ?? []),
    freeCells: Array.from({ length: 4 }, (_, i) => freeCells[i] ?? null),
    foundations: foundationsUpTo(foundations),
    moves: 0,
  };
}

/** Fill every column so none is empty (filler cards are irrelevant kings). */
const filler = [c("spades", 13)];

describe("deal", () => {
  it("deals 52 distinct face-up cards into 4 columns of 7 and 4 of 6", () => {
    const s = deal(1);
    expect(s.columns.map((x) => x.length)).toEqual([7, 7, 7, 7, 6, 6, 6, 6]);
    expect(new Set(s.columns.flat().map((x) => x.id)).size).toBe(52);
    expect(s.freeCells).toEqual([null, null, null, null]);
    expect(s.foundations.every((f) => f.length === 0)).toBe(true);
    expect(s.moves).toBe(0);
    expect(s.gameNumber).toBe(1);
  });

  it("is deterministic per number and differs between numbers", () => {
    expect(deal(617)).toEqual(deal(617));
    expect(deal(617).columns).not.toEqual(deal(618).columns);
  });

  it("validates the 1–32000 range", () => {
    expect(isValidGameNumber(1)).toBe(true);
    expect(isValidGameNumber(32000)).toBe(true);
    expect(isValidGameNumber(0)).toBe(false);
    expect(isValidGameNumber(32001)).toBe(false);
    expect(isValidGameNumber(1.5)).toBe(false);
    expect(() => deal(0)).toThrow(RangeError);
  });

  it("random game numbers stay in range", () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) expect(isValidGameNumber(randomGameNumber(rng))).toBe(true);
  });
});

describe("runs and supermove limit", () => {
  it("measures the ordered run at a column top", () => {
    expect(runLength([])).toBe(0);
    expect(runLength([c("hearts", 2)])).toBe(1);
    expect(runLength([c("clubs", 4), c("spades", 9), c("hearts", 8), c("clubs", 7)])).toBe(3);
    expect(runLength([c("spades", 9), c("clubs", 8)])).toBe(1); // same color breaks it
  });

  it("computes (free + 1) × 2^emptyColumns", () => {
    const full = makeState({ columns: Array(8).fill(filler), freeCells: [c("hearts", 9), c("hearts", 10), c("hearts", 11), c("hearts", 12)] });
    expect(maxMovable(full)).toBe(1);
    const twoFree = makeState({ columns: Array(8).fill(filler), freeCells: [c("hearts", 9), c("hearts", 10)] });
    expect(maxMovable(twoFree)).toBe(3);
    const oneEmptyCol = makeState({ columns: [...Array(7).fill(filler)], freeCells: [] });
    expect(maxMovable(oneEmptyCol)).toBe(10);
    // Moving into the empty column doesn't count that column.
    expect(maxMovable(oneEmptyCol, true)).toBe(5);
    const twoEmptyCols = makeState({ columns: [...Array(6).fill(filler)] });
    expect(maxMovable(twoEmptyCols)).toBe(20);
    expect(maxMovable(twoEmptyCols, true)).toBe(10);
  });

  it("allows a run exactly at the limit and rejects one over it", () => {
    // Run of 3 (9♥ 8♣ 7♦) onto 10♠ with 2 free cells: limit 3.
    const run = [c("hearts", 9), c("clubs", 8), c("diamonds", 7)];
    const base = {
      columns: [run, [c("spades", 10)], ...Array(6).fill(filler)],
      freeCells: [c("hearts", 13), c("diamonds", 13)],
    };
    const s = makeState(base);
    expect(isLegalMove(s, { from: col(0), to: col(1), count: 3 })).toBe(true);
    const tight = makeState({ ...base, freeCells: [c("hearts", 13), c("diamonds", 13), c("clubs", 13)] });
    expect(maxMovable(tight)).toBe(2);
    expect(isLegalMove(tight, { from: col(0), to: col(1), count: 3 })).toBe(false);
  });

  it("limits a run into an empty column without counting that column", () => {
    const run = [c("hearts", 9), c("clubs", 8), c("diamonds", 7), c("spades", 6)];
    const s = makeState({
      columns: [run, ...Array(6).fill(filler)], // column 7 empty
      freeCells: [c("hearts", 13), c("diamonds", 13), c("clubs", 13)],
    });
    // 1 free cell, 1 empty column (the target): limit (1+1)×2^0 = 2.
    expect(isLegalMove(s, { from: col(0), to: col(7), count: 2 })).toBe(true);
    expect(isLegalMove(s, { from: col(0), to: col(7), count: 3 })).toBe(false);
  });

  it("executes a supermove as one step", () => {
    const run = [c("hearts", 9), c("clubs", 8), c("diamonds", 7)];
    const s = makeState({ columns: [[c("hearts", 13), ...run], [c("spades", 10)], ...Array(6).fill(filler)] });
    const after = applyMove(s, { from: col(0), to: col(1), count: 3 });
    expect(after.columns[0]).toEqual([c("hearts", 13)]);
    expect(after.columns[1].map((x) => x.id)).toEqual(["spades-10", "hearts-9", "clubs-8", "diamonds-7"]);
  });
});

describe("legal moves", () => {
  const s = makeState({
    columns: [[c("spades", 5)], [c("hearts", 6)], [c("diamonds", 6)], [c("hearts", 1)], [c("clubs", 4)]],
    freeCells: [c("clubs", 2)],
  });

  it("tableau builds down in alternating colors", () => {
    expect(isLegalMove(s, { from: col(0), to: col(1), count: 1 })).toBe(true);
    expect(isLegalMove(s, { from: col(4), to: col(1), count: 1 })).toBe(false); // rank gap
    expect(isLegalMove(s, { from: col(1), to: col(2), count: 1 })).toBe(false);
  });

  it("free cells hold one card", () => {
    expect(isLegalMove(s, { from: col(0), to: cell(1), count: 1 })).toBe(true);
    expect(isLegalMove(s, { from: col(0), to: cell(0), count: 1 })).toBe(false);
  });

  it("foundations take the next rank of the suit, into its own pile", () => {
    expect(isLegalMove(s, { from: col(3), to: found(2), count: 1 })).toBe(true);
    const after = applyMove(s, { from: col(3), to: found(2), count: 1 });
    expect(after.foundations[SUITS.indexOf("hearts")]).toEqual([c("hearts", 1)]);
    expect(isLegalMove(s, { from: cell(0), to: found(), count: 1 })).toBe(false); // 2♣ without A♣
    expect(isLegalMove(s, { from: col(0), to: cell(1), count: 2 })).toBe(false);
  });

  it("cards never leave the foundations and moves to self are rejected", () => {
    const up = makeState({ foundations: { hearts: 3 }, columns: [[c("spades", 4)]] });
    expect(isLegalMove(up, { from: found(1), to: col(0), count: 1 })).toBe(false);
    expect(isLegalMove(up, { from: col(0), to: col(0), count: 1 })).toBe(false);
  });

  it("applyMove throws on an illegal move and never mutates", () => {
    const snapshot = JSON.stringify(s);
    expect(() => applyMove(s, { from: col(1), to: col(2), count: 1 })).toThrow();
    applyMove(s, { from: col(0), to: col(1), count: 1 });
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});

describe("resolveMove and quickMove", () => {
  it("finds the run length from a non-empty target", () => {
    const s = makeState({
      columns: [[c("hearts", 9), c("clubs", 8), c("diamonds", 7)], [c("spades", 10)], [c("spades", 8)]],
    });
    expect(resolveMove(s, col(0), col(1))).toEqual({ from: col(0), to: col(1), count: 3 });
    expect(resolveMove(s, col(0), col(2))).toEqual({ from: col(0), to: col(2), count: 1 });
    expect(resolveMove(s, col(1), col(2))).toBeNull();
  });

  it("uses the selected count for an empty column", () => {
    const s = makeState({ columns: [[c("hearts", 9), c("clubs", 8), c("diamonds", 7)]] });
    expect(resolveMove(s, col(0), col(5), 2)).toEqual({ from: col(0), to: col(5), count: 2 });
  });

  it("double-click goes to the foundation if legal, else a free cell", () => {
    const s = makeState({ columns: [[c("hearts", 2)], [c("spades", 9)]], foundations: { hearts: 1 } });
    expect(quickMove(s, col(0))?.to.kind).toBe("foundation");
    expect(quickMove(s, col(1))).toEqual({ from: col(1), to: cell(0), count: 1 });
    expect(quickMove(s, col(5))).toBeNull();
  });
});

describe("safe auto-moves", () => {
  it("always sends aces and twos", () => {
    const s = makeState({ columns: [[c("hearts", 1)], [c("hearts", 2)]] });
    const { state, moves } = autoMoves(s);
    expect(moves).toHaveLength(2);
    expect(state.foundations[SUITS.indexOf("hearts")]).toHaveLength(2);
  });

  it("holds a card that an opposite-color card could still need", () => {
    // 3♥ fits, but 2♠ is not up: a black 2 might still need to go on it.
    const s = makeState({ columns: [[c("hearts", 3)]], foundations: { hearts: 2, spades: 1, clubs: 2 } });
    expect(isSafeAutoMove(s, c("hearts", 3))).toBe(false);
    expect(autoMoves(s).moves).toHaveLength(0);
  });

  it("sends a card once both opposite-color rank−1 cards are up", () => {
    const s = makeState({ columns: [[c("hearts", 3)]], foundations: { hearts: 2, spades: 2, clubs: 2 } });
    expect(isSafeAutoMove(s, c("hearts", 3))).toBe(true);
    expect(autoMoves(s).moves).toEqual([{ from: col(0), to: found(SUITS.indexOf("hearts")), count: 1 }]);
  });

  it("cascades from free cells and columns", () => {
    const s = makeState({
      columns: [[c("spades", 2), c("spades", 1)]],
      freeCells: [c("clubs", 1)],
    });
    const { state } = autoMoves(s);
    expect(state.foundations[SUITS.indexOf("spades")]).toHaveLength(2);
    expect(state.foundations[SUITS.indexOf("clubs")]).toHaveLength(1);
    expect(state.freeCells[0]).toBeNull();
  });
});

describe("game with history", () => {
  it("counts user moves and undoes a move with its auto-moves as one step", () => {
    const start = {
      state: makeState({ columns: [[c("hearts", 1), c("spades", 9)], [c("diamonds", 10)]] }),
      past: [],
    };
    const g = play(start, { from: col(0), to: col(1), count: 1 });
    expect(g.state.moves).toBe(1);
    // A♥ got exposed and went up automatically.
    expect(g.state.foundations[SUITS.indexOf("hearts")]).toHaveLength(1);
    expect(canUndo(g)).toBe(true);
    const back = undo(g);
    expect(back).toEqual(start);
    expect(canUndo(back)).toBe(false);
    expect(undo(back)).toBe(back);
  });

  it("ignores illegal moves", () => {
    const start = { state: makeState({ columns: [[c("hearts", 5)], [c("diamonds", 6)]] }), past: [] };
    expect(play(start, { from: col(0), to: col(1), count: 1 })).toBe(start);
  });

  it("newGame settles aces dealt on top; restart returns to it", () => {
    const g = newGame(42);
    expect(g.past).toEqual([]);
    expect(autoMoves(g.state).moves).toHaveLength(0);
    const moved = play(g, quickMoveAny(g.state));
    expect(restart(moved)).toEqual(g);
  });
});

/** Any legal quick move in a fresh deal (there is always a free cell). */
function quickMoveAny(s: FreeCellState) {
  for (let i = 0; i < 8; i++) {
    const m = quickMove(s, col(i));
    if (m) return m;
  }
  throw new Error("no move");
}

describe("end of game", () => {
  it("detects a win and cards left", () => {
    const won = makeState({ foundations: { spades: 13, hearts: 13, diamonds: 13, clubs: 13 } });
    expect(isWon(won)).toBe(true);
    expect(cardsLeft(won)).toBe(0);
    expect(isWon(deal(5))).toBe(false);
    expect(cardsLeft(deal(5))).toBe(52);
  });

  it("detects no more legal moves", () => {
    // Every free cell and column full, no card stacks anywhere, nothing goes up.
    const stuck = makeState({
      freeCells: [c("hearts", 13), c("diamonds", 13), c("clubs", 13), c("spades", 13)],
      columns: [
        [c("hearts", 5)],
        [c("hearts", 7)],
        [c("hearts", 9)],
        [c("diamonds", 5)],
        [c("diamonds", 7)],
        [c("diamonds", 9)],
        [c("hearts", 11)],
        [c("diamonds", 11)],
      ],
    });
    expect(hasLegalMoves(stuck)).toBe(false);
    const withCell = { ...stuck, freeCells: [null, ...stuck.freeCells.slice(1)] };
    expect(hasLegalMoves(withCell)).toBe(true);
  });

  it("a fresh deal has legal moves", () => {
    expect(hasLegalMoves(deal(100))).toBe(true);
  });
});
