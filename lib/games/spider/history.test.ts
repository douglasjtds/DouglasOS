import { describe, expect, it } from "vitest";
import type { Rank, Suit } from "@/lib/games/cards";
import { findHint, legalMoves, score, type SpiderState, type TableauCard } from "@/lib/games/spider/engine";
import { canUndo, newGame, spiderReducer, undo, type SpiderGame } from "@/lib/games/spider/history";

const up = (rank: number, suit: Suit = "spades"): TableauCard => ({
  card: { id: `${suit}-${rank}-${Math.random()}`, suit, rank: rank as Rank },
  faceUp: true,
});

function gameWith(state: Partial<SpiderState>): SpiderGame {
  return {
    state: { suitCount: 1, columns: [], stock: [], completed: [], moves: 0, ...state },
    history: [],
  };
}

describe("spiderReducer", () => {
  it("starts a new seeded game", () => {
    const g = spiderReducer(newGame(1), { type: "new", seed: 9, suitCount: 4 });
    expect(g.state.suitCount).toBe(4);
    expect(g.history).toEqual([]);
    expect(g).toEqual(newGame(9, 4));
  });

  it("records moves and undoes them", () => {
    let g = newGame(5, 1);
    const move = legalMoves(g.state)[0];
    expect(move).toBeDefined();
    const before = g.state;
    g = spiderReducer(g, { type: "move", move });
    expect(g.state.moves).toBe(1);
    expect(canUndo(g)).toBe(true);
    g = spiderReducer(g, { type: "undo" });
    expect(g.state).toBe(before);
    expect(canUndo(g)).toBe(false);
  });

  it("ignores illegal moves without adding history", () => {
    const g = newGame(5, 1);
    const next = spiderReducer(g, { type: "move", move: { from: 0, index: 0, to: 1 } });
    expect(next).toBe(g);
  });

  it("deals a row and undoes it", () => {
    let g = newGame(3, 2);
    const before = g.state;
    g = spiderReducer(g, { type: "deal" });
    expect(g.state.stock).toHaveLength(40);
    g = spiderReducer(g, { type: "undo" });
    expect(g.state).toBe(before);
  });

  it("undoes a run completion together with the move that completed it", () => {
    const run: TableauCard[] = [];
    for (let r = 13; r >= 2; r--) run.push(up(r));
    const columns = [run, [up(1)], ...Array.from({ length: 8 }, () => [up(9, "hearts")])];
    let g = gameWith({ columns });
    g = spiderReducer(g, { type: "move", move: { from: 1, index: 0, to: 0 } });
    expect(g.state.completed).toEqual(["spades"]);
    expect(score(g.state)).toBe(599);
    g = spiderReducer(g, { type: "undo" });
    expect(g.state.completed).toEqual([]);
    expect(g.state.columns[0]).toHaveLength(12);
    expect(g.state.columns[1]).toHaveLength(1);
  });

  it("undo on a fresh game is a no-op", () => {
    const g = newGame(1);
    expect(undo(g)).toBe(g);
  });
});

describe("a seeded 1-suit game played by hints", () => {
  it("only ever makes legal progress and keeps card count constant", () => {
    let g = newGame(2024, 1);
    for (let i = 0; i < 400; i++) {
      const hint = findHint(g.state);
      const next = hint ? spiderReducer(g, { type: "move", move: hint }) : spiderReducer(g, { type: "deal" });
      if (next === g) break;
      g = next;
      const onTable = g.state.columns.flat().length + g.state.stock.length;
      expect(onTable + g.state.completed.length * 13).toBe(104);
    }
    expect(g.state.moves).toBeGreaterThan(0);
  });
});
