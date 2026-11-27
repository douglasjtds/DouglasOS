import { describe, expect, it } from "vitest";
import type { Card, Rank, Suit } from "@/lib/games/cards";
import {
  applyMove,
  bestDestination,
  canDrop,
  canPickUp,
  deal,
  dealBlock,
  dealRow,
  dealsLeft,
  findHint,
  isLegalMove,
  isWon,
  legalMoves,
  movableRunStart,
  score,
  type SpiderState,
  type TableauCard,
} from "@/lib/games/spider/engine";

let uid = 0;
const card = (rank: Rank, suit: Suit = "spades"): Card => ({ id: `${suit}-${rank}-t${uid++}`, suit, rank });
const up = (rank: Rank, suit: Suit = "spades"): TableauCard => ({ card: card(rank, suit), faceUp: true });
const down = (rank: Rank, suit: Suit = "spades"): TableauCard => ({ card: card(rank, suit), faceUp: false });
/** Face-up same-suit run from `high` down to `low`. */
const run = (high: number, low: number, suit: Suit = "spades"): TableauCard[] => {
  const out: TableauCard[] = [];
  for (let r = high; r >= low; r--) out.push(up(r as Rank, suit));
  return out;
};

/** A state with the given columns (padded to 10 with a lone face-up card) and stock. */
function table(columns: TableauCard[][], { stock = [] as Card[], pad = true } = {}): SpiderState {
  const all = columns.slice();
  while (all.length < 10) all.push(pad ? [down(5, "clubs"), up(1, "clubs")] : []);
  return { suitCount: 4, columns: all, stock, completed: [], moves: 0 };
}

describe("deal", () => {
  it("lays out 54 cards (6,6,6,6,5,5,5,5,5,5) with only the top card face up, 50 in stock", () => {
    const s = deal(42, 1);
    expect(s.columns.map((c) => c.length)).toEqual([6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
    for (const column of s.columns) {
      expect(column.slice(0, -1).every((c) => !c.faceUp)).toBe(true);
      expect(column[column.length - 1].faceUp).toBe(true);
    }
    expect(s.stock).toHaveLength(50);
    expect(dealsLeft(s)).toBe(5);
    expect(s.completed).toEqual([]);
    expect(s.moves).toBe(0);
    expect(score(s)).toBe(500);
  });

  it("uses 104 unique cards from the requested suits", () => {
    for (const [count, suits] of [
      [1, ["spades"]],
      [2, ["hearts", "spades"]],
      [4, ["clubs", "diamonds", "hearts", "spades"]],
    ] as const) {
      const s = deal(7, count);
      const cards = [...s.columns.flat().map((c) => c.card), ...s.stock];
      expect(cards).toHaveLength(104);
      expect(new Set(cards.map((c) => c.id)).size).toBe(104);
      expect([...new Set(cards.map((c) => c.suit))].sort()).toEqual(suits);
      expect(s.suitCount).toBe(count);
    }
  });

  it("is deterministic per seed", () => {
    expect(deal(123, 2)).toEqual(deal(123, 2));
    expect(deal(123, 2)).not.toEqual(deal(124, 2));
  });
});

describe("canPickUp / movableRunStart", () => {
  const column = [down(9), up(7, "hearts"), up(6), up(5), up(4)];

  it("allows a same-suit descending run and any single top card", () => {
    expect(canPickUp(column, 4)).toBe(true);
    expect(canPickUp(column, 2)).toBe(true);
    expect(movableRunStart(column)).toBe(2);
  });

  it("rejects mixed suits, face-down cards and out-of-range indexes", () => {
    expect(canPickUp(column, 1)).toBe(false); // 7♥ under 6♠: built, but mixed suit
    expect(canPickUp(column, 0)).toBe(false);
    expect(canPickUp(column, 5)).toBe(false);
    expect(canPickUp(column, -1)).toBe(false);
  });

  it("rejects a non-descending run", () => {
    expect(canPickUp([up(5), up(5)], 0)).toBe(false);
    expect(canPickUp([up(3), up(5)], 0)).toBe(false);
  });

  it("returns -1 for an empty column", () => {
    expect(movableRunStart([])).toBe(-1);
  });
});

describe("canDrop", () => {
  it("accepts one rank lower regardless of suit, and anything on an empty column", () => {
    expect(canDrop([up(8, "hearts")], card(7, "spades"))).toBe(true);
    expect(canDrop([], card(3))).toBe(true);
    expect(canDrop([up(8)], card(6))).toBe(false);
    expect(canDrop([up(8)], card(9))).toBe(false);
    expect(canDrop([down(8)], card(7))).toBe(false);
  });
});

describe("applyMove", () => {
  it("moves a run, flips the newly exposed card and counts a move", () => {
    const s = table([[down(9, "hearts"), up(5), up(4)], [up(6, "hearts")]]);
    const next = applyMove(s, { from: 0, index: 1, to: 1 });
    expect(next.columns[0]).toHaveLength(1);
    expect(next.columns[0][0].faceUp).toBe(true);
    expect(next.columns[1].map((c) => c.card.rank)).toEqual([6, 5, 4]);
    expect(next.moves).toBe(1);
    expect(score(next)).toBe(499);
    expect(s.columns[0]).toHaveLength(3); // input untouched
  });

  it("moves any run into an empty column", () => {
    const s = table([[up(2), up(1)], []]);
    const next = applyMove(s, { from: 0, index: 0, to: 1 });
    expect(next.columns[0]).toEqual([]);
    expect(next.columns[1]).toHaveLength(2);
  });

  it("returns the same state for illegal moves", () => {
    const s = table([[up(7, "hearts"), up(6)], [up(9)]]);
    expect(applyMove(s, { from: 0, index: 0, to: 1 })).toBe(s); // mixed-suit run
    expect(applyMove(s, { from: 0, index: 1, to: 1 })).toBe(s); // 6 onto 9
    expect(applyMove(s, { from: 0, index: 1, to: 0 })).toBe(s); // same column
    expect(isLegalMove(s, { from: 0, index: 1, to: 99 })).toBe(false);
  });

  it("removes a completed King→Ace run, flips the card under it and scores +100", () => {
    const s = table([[down(3, "hearts"), ...run(13, 2, "hearts")], [up(1, "hearts")]]);
    const next = applyMove(s, { from: 1, index: 0, to: 0 });
    expect(next.completed).toEqual(["hearts"]);
    expect(next.columns[0]).toHaveLength(1);
    expect(next.columns[0][0].faceUp).toBe(true);
    expect(next.columns[1]).toEqual([]);
    expect(score(next)).toBe(500 - 1 + 100);
  });

  it("does not remove a King→Ace run of mixed suits", () => {
    const s = table([[...run(13, 2, "hearts")], [up(1, "spades")]]);
    const next = applyMove(s, { from: 1, index: 0, to: 0 });
    expect(next.completed).toEqual([]);
    expect(next.columns[0]).toHaveLength(13);
  });
});

describe("dealRow", () => {
  const stock = Array.from({ length: 20 }, (_, i) => card(((i % 13) + 1) as Rank, "diamonds"));

  it("adds one face-up card to every column and counts a move", () => {
    const s = table([], { stock });
    const next = dealRow(s);
    expect(next.columns.every((c) => c.length === 3 && c[2].faceUp)).toBe(true);
    expect(next.columns.map((c) => c[2].card)).toEqual(stock.slice(0, 10));
    expect(next.stock).toEqual(stock.slice(10));
    expect(dealsLeft(next)).toBe(1);
    expect(next.moves).toBe(1);
  });

  it("is blocked while any column is empty", () => {
    const s = table([[]], { stock });
    expect(dealBlock(s)).toBe("empty-column");
    expect(dealRow(s)).toBe(s);
  });

  it("is blocked when the stock is empty", () => {
    const s = table([]);
    expect(dealBlock(s)).toBe("empty-stock");
    expect(dealRow(s)).toBe(s);
    expect(dealBlock(table([], { stock }))).toBeNull();
  });

  it("can complete a run", () => {
    const row = [card(1, "clubs"), ...Array.from({ length: 9 }, () => card(9, "diamonds"))];
    const s = table([run(13, 2, "clubs")], { stock: row });
    const next = dealRow(s);
    expect(next.completed).toEqual(["clubs"]);
    expect(next.columns[0]).toEqual([]);
  });
});

describe("isWon", () => {
  it("is won with 8 completed runs", () => {
    const s = table([], { pad: false });
    expect(isWon(s)).toBe(false);
    expect(isWon({ ...s, completed: Array(8).fill("spades") })).toBe(true);
  });
});

describe("legalMoves / findHint", () => {
  it("lists every legal move", () => {
    const s = table([[up(5)], [up(6)], [up(6, "hearts")]], { pad: false });
    // Columns 3–9 are empty: 5 can go to 6♠, 6♥, or (pointlessly) any empty column.
    const moves = legalMoves(s);
    expect(moves).toContainEqual({ from: 0, index: 0, to: 1 });
    expect(moves).toContainEqual({ from: 0, index: 0, to: 2 });
  });

  it("prefers a same-suit build", () => {
    const s = table([[up(5)], [up(6, "hearts")], [up(6)]]);
    expect(findHint(s)).toEqual({ from: 0, index: 0, to: 2 });
  });

  it("prefers uncovering a face-down card over a plain build", () => {
    const s = table([
      [down(9), up(5, "hearts")],
      [up(4, "diamonds")],
      [up(6, "clubs")],
    ]);
    // 4♦ → 5♥ uncovers nothing; 5♥ → 6♣ uncovers the face-down 9.
    expect(findHint(s)).toEqual({ from: 0, index: 1, to: 2 });
  });

  it("ignores sideways moves and returns null when nothing useful is left", () => {
    // 5♠ already sits on 6♥; moving it to 6♦ changes nothing.
    const s = table([[up(6, "hearts"), up(5)], [up(6, "diamonds")]]);
    expect(legalMoves(s).length).toBeGreaterThan(0);
    expect(findHint(s)).toBeNull();
  });

  it("suggests switching a card onto its own suit", () => {
    const s = table([[up(6, "hearts"), up(5)], [up(6)]]);
    expect(findHint(s)).toEqual({ from: 0, index: 1, to: 1 });
  });

  it("returns null with no legal moves", () => {
    expect(findHint(table([]))).toBeNull();
  });
});

describe("bestDestination", () => {
  it("prefers same suit, then any higher card, then an empty column", () => {
    const s = table([[down(2), up(5)], [up(6, "hearts")], [up(6)], []]);
    expect(bestDestination(s, 0, 1)).toBe(2);
    const noSame = table([[down(2), up(5)], [up(6, "hearts")], []]);
    expect(bestDestination(noSame, 0, 1)).toBe(1);
    const onlyEmpty = table([[down(2), up(5)], []]);
    expect(bestDestination(onlyEmpty, 0, 1)).toBe(1);
  });

  it("never moves a whole column into an empty one, and rejects unmovable runs", () => {
    const s = table([[up(5)], []]);
    expect(bestDestination(s, 0, 0)).toBeNull();
    expect(bestDestination(s, 0, 3)).toBeNull();
  });
});
