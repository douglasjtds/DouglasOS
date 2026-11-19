import { describe, expect, it } from "vitest";
import {
  COL_PITCH,
  GRID_TOP,
  GRID_X,
  ROW_PITCH,
  cellToPixel,
  defaultCells,
  gridDims,
  iconsInGridOrder,
  nearestFreeCell,
  neighborIcon,
  pixelToCell,
  type Cell,
} from "@/lib/store/desktopGrid";
import { TASKBAR_H, type Viewport } from "@/lib/store/geometry";

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

describe("grid pitch", () => {
  it("mirrors the desktop-cell token (88 × 96px)", () => {
    expect(COL_PITCH).toBe(88);
    expect(ROW_PITCH).toBe(96);
  });

  it("keeps the last row clear of the taskbar", () => {
    const { rows } = gridDims(VP);
    const bottomRowY = GRID_TOP + (rows - 1) * ROW_PITCH;
    expect(bottomRowY + 88).toBeLessThanOrEqual(VP.height - TASKBAR_H);
  });

  it("places the first cell at the top-left inset", () => {
    expect(cellToPixel({ col: 0, row: 0 }, VP)).toEqual({ x: GRID_X, y: GRID_TOP });
  });
});

describe("defaultCells", () => {
  const ids = ["a", "b", "c", "d", "e", "f", "g"] as const;

  it("fills the first column top-to-bottom when there is room", () => {
    const cells = defaultCells(ids, VP);
    ids.forEach((id, i) => expect(cells[id]).toEqual({ col: 0, row: i }));
  });

  it("wraps to the next column on a short work area", () => {
    const short: Viewport = { width: 1024, height: 600 };
    const { rows } = gridDims(short);
    expect(rows).toBeLessThan(ids.length);
    const cells = defaultCells(ids, short);
    expect(cells[ids[rows]]).toEqual({ col: 1, row: 0 });
  });

  it("assigns every launcher a distinct cell (no overlap by construction)", () => {
    for (const vp of [VP, { width: 768, height: 600 }]) {
      const keys = Object.values(defaultCells(ids, vp)).map(
        (c) => `${c.col},${c.row}`,
      );
      expect(new Set(keys).size).toBe(ids.length);
    }
  });
});

describe("neighborIcon", () => {
  const cells = {
    a: { col: 0, row: 0 },
    b: { col: 0, row: 1 },
    c: { col: 0, row: 2 },
    d: { col: 1, row: 0 },
  };

  it("moves down and up within a column", () => {
    expect(neighborIcon(cells, "a", "down")).toBe("b");
    expect(neighborIcon(cells, "c", "up")).toBe("b");
  });

  it("moves across columns to the closest row", () => {
    expect(neighborIcon(cells, "a", "right")).toBe("d");
    expect(neighborIcon(cells, "d", "left")).toBe("a");
  });

  it("returns null at the edge of the grid", () => {
    expect(neighborIcon(cells, "c", "down")).toBeNull();
    expect(neighborIcon(cells, "a", "left")).toBeNull();
  });
});

describe("iconsInGridOrder", () => {
  it("sorts column-first (col, then row)", () => {
    expect(
      iconsInGridOrder({
        x: { col: 1, row: 0 },
        y: { col: 0, row: 2 },
        z: { col: 0, row: 0 },
      }),
    ).toEqual(["z", "y", "x"]);
  });
});
