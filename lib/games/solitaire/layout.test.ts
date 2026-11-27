import { describe, expect, it } from "vitest";
import { deal } from "./engine";
import { clampFocus, columnX, fanOffsets, moveFocus, pileAtPoint, tableMetrics } from "./layout";

describe("tableMetrics", () => {
  it("caps cards at the desktop size on wide tables", () => {
    const m = tableMetrics(900);
    expect(m.cardW).toBe(71);
    expect(m.cardH).toBe(96);
  });

  it("fits seven columns in a 390px phone without overflow", () => {
    const m = tableMetrics(390);
    expect(m.cardW).toBeGreaterThanOrEqual(42);
    expect(columnX(m, 6) + m.cardW + m.pad).toBeLessThanOrEqual(390);
  });

  it("puts the tableau below the top row", () => {
    const m = tableMetrics(390);
    expect(m.tableauTop).toBeGreaterThan(m.pad + m.cardH);
  });
});

describe("fanOffsets", () => {
  it("uses roomy defaults when the column fits", () => {
    expect(fanOffsets(96, 3, 4, 1000)).toEqual({ down: 10, up: 29 });
  });

  it("tightens face-up steps first when the column would overflow", () => {
    const { down, up } = fanOffsets(96, 2, 12, 400);
    expect(down).toBe(10);
    expect(up).toBeLessThan(29);
    expect(2 * down + 11 * up + 96).toBeLessThanOrEqual(400);
  });

  it("never squeezes face-up cards below a readable corner, then tightens face-down", () => {
    const { down, up } = fanOffsets(96, 6, 13, 200);
    expect(up).toBe(19);
    expect(down).toBeGreaterThanOrEqual(1);
    expect(down).toBeLessThan(10);
  });
});

describe("moveFocus", () => {
  const board = deal(5);

  it("Left/Right walk all 13 piles and wrap", () => {
    expect(moveFocus(board, { pile: 0, card: 0 }, "ArrowRight")).toEqual({ pile: 1, card: 0 });
    expect(moveFocus(board, { pile: 0, card: 0 }, "ArrowLeft")).toEqual({ pile: 12, card: 0 });
    expect(moveFocus(board, { pile: 12, card: 0 }, "ArrowRight")).toEqual({ pile: 0, card: 0 });
  });

  it("Down from the top row lands on the column below; Up from a column's first card goes back up", () => {
    expect(moveFocus(board, { pile: 0, card: 0 }, "ArrowDown")).toEqual({ pile: 6, card: 0 });
    expect(moveFocus(board, { pile: 2, card: 0 }, "ArrowDown")).toEqual({ pile: 9, card: 0 });
    expect(moveFocus(board, { pile: 12, card: 0 }, "ArrowUp")).toEqual({ pile: 5, card: 0 });
    expect(moveFocus(board, { pile: 8, card: 0 }, "ArrowUp")).toEqual({ pile: 1, card: 0 });
    expect(moveFocus(board, { pile: 3, card: 0 }, "ArrowUp")).toEqual({ pile: 3, card: 0 });
  });

  it("Up/Down move within a column's face-up run", () => {
    const tall = {
      ...board,
      tableau: board.tableau.map((c, i) => (i === 0 ? { faceDown: [], faceUp: [...c.faceUp, ...board.stock.slice(0, 2)] } : c)),
    };
    expect(moveFocus(tall, { pile: 6, card: 0 }, "ArrowDown")).toEqual({ pile: 6, card: 1 });
    expect(moveFocus(tall, { pile: 6, card: 2 }, "ArrowDown")).toEqual({ pile: 6, card: 2 });
    expect(moveFocus(tall, { pile: 6, card: 2 }, "ArrowUp")).toEqual({ pile: 6, card: 1 });
    expect(moveFocus(tall, { pile: 1, card: 0 }, "ArrowDown")).toEqual({ pile: 7, card: 0 });
  });

  it("Home/End jump to the first and last pile; clampFocus keeps the card in range", () => {
    expect(moveFocus(board, { pile: 7, card: 0 }, "Home")).toEqual({ pile: 0, card: 0 });
    expect(moveFocus(board, { pile: 0, card: 0 }, "End")).toEqual({ pile: 12, card: 0 });
    expect(clampFocus(board, { pile: 6, card: 5 })).toEqual({ pile: 6, card: 0 });
  });
});

describe("pileAtPoint", () => {
  const m = tableMetrics(900);
  const mid = (col: number) => columnX(m, col) + m.cardW / 2;

  it("maps the top row to stock, waste and foundations, skipping the gap", () => {
    expect(pileAtPoint(m, mid(0), m.pad + 10)).toBe(0);
    expect(pileAtPoint(m, mid(1), m.pad + 10)).toBe(1);
    expect(pileAtPoint(m, mid(2), m.pad + 10)).toBeNull();
    expect(pileAtPoint(m, mid(3), m.pad + 10)).toBe(2);
    expect(pileAtPoint(m, mid(6), m.pad + 10)).toBe(5);
  });

  it("maps everything below the top row to the tableau columns", () => {
    expect(pileAtPoint(m, mid(0), m.tableauTop + 300)).toBe(6);
    expect(pileAtPoint(m, mid(6), m.tableauTop)).toBe(12);
    expect(pileAtPoint(m, columnX(m, 6) + m.cardW + m.gap * 2, m.tableauTop)).toBeNull();
    expect(pileAtPoint(m, -20, m.tableauTop)).toBeNull();
  });
});
