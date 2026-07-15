import { describe, expect, it } from "vitest";
import {
  DEFAULT_CELLS,
  cellToPixel,
  gridDims,
  nearestFreeCell,
  pixelToCell,
  type Cell,
} from "@/lib/store/desktopGrid";
import type { Viewport } from "@/lib/store/geometry";

const VP: Viewport = { width: 1440, height: 900 };

describe("gridDims", () => {
  it("returns a positive number of cells for a normal viewport", () => {
    const { cols, rows } = gridDims(VP);
    expect(cols).toBeGreaterThan(1);
    expect(rows).toBeGreaterThan(1);
  });

  it("floors at a 1x1 grid for a tiny viewport", () => {
    const { cols, rows } = gridDims({ width: 50, height: 50 });
    expect(cols).toBe(1);
    expect(rows).toBe(1);
  });
});

describe("cellToPixel / pixelToCell round-trip", () => {
  it("maps a cell to a pixel and back to the same cell", () => {
    const cell: Cell = { col: 2, row: 1 };
    const px = cellToPixel(cell, VP);
    expect(pixelToCell(px.x, px.y, VP)).toEqual(cell);
  });

  it("clamps out-of-range cells into the grid", () => {
    const { cols, rows } = gridDims(VP);
    const px = cellToPixel({ col: 999, row: 999 }, VP);
    expect(pixelToCell(px.x, px.y, VP)).toEqual({
      col: cols - 1,
      row: rows - 1,
    });
  });

  it("snaps an arbitrary pixel to the nearest cell", () => {
    const target: Cell = { col: 1, row: 1 };
    const px = cellToPixel(target, VP);
    // Nudge a few px off the exact cell origin; it should still round to it.
    expect(pixelToCell(px.x + 10, px.y - 8, VP)).toEqual(target);
  });
});

describe("nearestFreeCell", () => {
  it("returns the target when it is free", () => {
    const target: Cell = { col: 2, row: 1 };
    expect(nearestFreeCell(target, [], VP)).toEqual(target);
  });

  it("returns the nearest neighbour when the target is occupied", () => {
    const target: Cell = { col: 2, row: 1 };
    const result = nearestFreeCell(target, [target], VP);
    expect(result).not.toEqual(target);
    // The replacement is exactly one Chebyshev ring away.
    const dist = Math.max(
      Math.abs(result.col - target.col),
      Math.abs(result.row - target.row),
    );
    expect(dist).toBe(1);
  });

  it("falls back to the target when the whole grid is full", () => {
    const { cols, rows } = gridDims(VP);
    const occupied: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) occupied.push({ col: c, row: r });
    }
    const target: Cell = { col: 1, row: 1 };
    expect(nearestFreeCell(target, occupied, VP)).toEqual(target);
  });
});

describe("DEFAULT_CELLS", () => {
  it("assigns every launcher a distinct cell (no overlap by construction)", () => {
    const cells = Object.values(DEFAULT_CELLS);
    const keys = cells.map((c) => `${c.col},${c.row}`);
    expect(new Set(keys).size).toBe(cells.length);
  });
});
