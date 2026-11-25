import { describe, expect, it } from "vitest";
import { cellToPixel, defaultCells, type Cell } from "@/lib/store/desktopGrid";
import {
  iconsInLasso,
  lassoRect,
  mergeSelections,
  moveGroup,
  rectsIntersect,
  toggleInSelection,
} from "@/lib/store/desktopSelection";

const VP = { width: 1440, height: 900 };

describe("lasso", () => {
  it("normalizes a drag in any direction", () => {
    expect(lassoRect({ x: 50, y: 80 }, { x: 10, y: 20 })).toEqual({ x: 10, y: 20, width: 40, height: 60 });
    expect(lassoRect({ x: 10, y: 20 }, { x: 50, y: 80 })).toEqual({ x: 10, y: 20, width: 40, height: 60 });
  });

  it("intersects rectangles (touching edges don't count)", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    expect(rectsIntersect(a, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
    expect(rectsIntersect(a, { x: 10, y: 0, width: 10, height: 10 })).toBe(false);
  });

  it("selects every icon the lasso touches, in grid order", () => {
    const cells: Record<string, Cell> = { a: { col: 0, row: 0 }, b: { col: 0, row: 1 }, c: { col: 0, row: 2 }, d: { col: 1, row: 0 } };
    const b = cellToPixel(cells.b, VP);
    // From the middle of c up to the top of b, only in column 0.
    const rect = lassoRect({ x: b.x + 10, y: b.y + 40 }, { x: b.x + 30, y: b.y + 96 + 20 });
    expect(iconsInLasso(rect, cells, VP)).toEqual(["b", "c"]);
    expect(iconsInLasso({ x: 0, y: 0, width: 2000, height: 2000 }, cells, VP)).toEqual(["a", "b", "c", "d"]);
    expect(iconsInLasso({ x: 600, y: 600, width: 10, height: 10 }, cells, VP)).toEqual([]);
  });

  it("toggles and merges selections", () => {
    expect(toggleInSelection(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleInSelection(["b"], "a")).toEqual(["b", "a"]);
    expect(mergeSelections(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });
});

describe("moveGroup", () => {
  const cells = defaultCells(["a", "b", "c", "d"] as const, VP); // column 0, rows 0–3

  it("moves the group by the same offset, keeping relative positions", () => {
    const next = moveGroup(cells, ["a", "b"], "a", 88 * 4, 96 * 2, VP);
    expect(next.a).toEqual({ col: 4, row: 2 });
    expect(next.b).toEqual({ col: 4, row: 3 });
    expect(next.c).toEqual(cells.c);
    expect(next.d).toEqual(cells.d);
  });

  it("never stacks on icons that don't move or on reserved cells, deterministically", () => {
    // a and b move one row down: b's target is c's cell (not moving).
    const next = moveGroup(cells, ["a", "b"], "a", 0, 96, VP);
    const keys = Object.values(next).map((c) => `${c.col},${c.row}`);
    expect(new Set(keys).size).toBe(4);
    expect(next.a).toEqual({ col: 0, row: 1 });
    expect(next.c).toEqual(cells.c);
    expect(moveGroup(cells, ["a", "b"], "a", 0, 96, VP)).toEqual(next);
    // A reserved cell (the bin) is dodged too.
    const reserved = [{ col: 5, row: 5 }];
    const dodged = moveGroup(cells, ["d"], "d", 88 * 5, 96 * 2, VP, reserved);
    expect(dodged.d).not.toEqual({ col: 5, row: 5 });
  });

  it("places the dragged icon first when the group collides with itself at the edge", () => {
    // Dragging far left clamps both to column 0; the anchor keeps its target.
    const moved = moveGroup(cells, ["c", "d"], "d", -500, 0, VP);
    expect(moved.d).toEqual({ col: 0, row: 3 });
    expect(moved.c).toEqual({ col: 0, row: 2 });
  });

  it("returns the same record when nothing moved", () => {
    expect(moveGroup(cells, ["a"], "a", 2, 2, VP)).toBe(cells);
    expect(moveGroup(cells, [], "a", 200, 0, VP)).toBe(cells);
  });
});
