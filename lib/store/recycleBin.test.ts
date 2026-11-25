import { describe, expect, it } from "vitest";
import { gridDims, mobileIconLayout, cellToPixel } from "@/lib/store/desktopGrid";
import {
  BIN_HIT_SLOP,
  binBalloonPlacement,
  binHitRect,
  defaultBinCell,
  hitsBin,
  iconRect,
  mobileBinPlacement,
} from "@/lib/store/recycleBin";
import { DESKTOP_ICON_GROUPS } from "@/lib/apps/registry";
import { TASKBAR_H } from "@/lib/store/geometry";

const VP = { width: 1440, height: 900 };
const BALLOON = { width: 300, maxHeight: 320 };

describe("recycleBin geometry", () => {
  it("defaults the bin to the top-right cell of the grid", () => {
    const { cols } = gridDims(VP);
    expect(defaultBinCell(VP)).toEqual({ col: cols - 1, row: 0 });
    expect(defaultBinCell({ width: 800, height: 600 })).toEqual({
      col: gridDims({ width: 800, height: 600 }).cols - 1,
      row: 0,
    });
  });

  it("hit-tests a drop point against the bin's footprint plus slop, on its current cell", () => {
    const cell = defaultBinCell(VP);
    const r = iconRect(cell, VP);
    expect(hitsBin({ x: r.x + r.width / 2, y: r.y + r.height / 2 }, cell, VP)).toBe(true);
    expect(hitsBin({ x: r.x - BIN_HIT_SLOP, y: r.y }, cell, VP)).toBe(true);
    expect(hitsBin({ x: r.x - BIN_HIT_SLOP - 1, y: r.y }, cell, VP)).toBe(false);
    expect(hitsBin({ x: r.x + r.width / 2, y: r.y + r.height + BIN_HIT_SLOP + 1 }, cell, VP)).toBe(false);
    // The top-left icon is nowhere near.
    expect(hitsBin(cellToPixel({ col: 0, row: 0 }, VP), cell, VP)).toBe(false);
    expect(binHitRect(cell, VP).width).toBe(r.width + 2 * BIN_HIT_SLOP);
    // A moved bin: only its new cell is a drop target.
    const moved = { col: 6, row: 4 };
    const m = iconRect(moved, VP);
    expect(hitsBin({ x: m.x + 10, y: m.y + 10 }, moved, VP)).toBe(true);
    expect(hitsBin({ x: r.x + 10, y: r.y + 10 }, moved, VP)).toBe(false);
  });

  it("opens the bin's balloon below a top-right bin, kept on screen, tail on the bin", () => {
    for (const vp of [VP, { width: 768, height: 600 }, { width: 1920, height: 1080 }]) {
      const cell = defaultBinCell(vp);
      const bin = iconRect(cell, vp);
      const p = binBalloonPlacement(cell, vp, BALLOON);
      expect(p.side).toBe("below");
      expect(p.offset).toBeGreaterThan(bin.y + bin.height);
      expect(p.offset + p.maxHeight).toBeLessThanOrEqual(vp.height - TASKBAR_H);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + p.width).toBeLessThanOrEqual(vp.width);
      expect(p.x + p.tailX).toBeGreaterThanOrEqual(bin.x);
      expect(p.x + p.tailX).toBeLessThanOrEqual(bin.x + bin.width);
    }
  });

  it("opens the balloon above a bin low on the screen, and to the right of a left-column bin", () => {
    const { rows } = gridDims(VP);
    const low = binBalloonPlacement({ col: 7, row: rows - 1 }, VP, BALLOON);
    const bin = iconRect({ col: 7, row: rows - 1 }, VP);
    expect(low.side).toBe("above");
    expect(VP.height - low.offset).toBeLessThan(bin.y);
    expect(VP.height - low.offset - low.maxHeight).toBeGreaterThanOrEqual(0);
    const left = binBalloonPlacement({ col: 0, row: 3 }, VP, BALLOON);
    expect(left.x).toBe(8);
    expect(left.tailX).toBeLessThan(76);
  });

  it("puts the bin on its own trailing row, right-most column, on phones", () => {
    for (const width of [320, 390, 412, 767]) {
      const layout = mobileIconLayout(DESKTOP_ICON_GROUPS, width);
      const bin = mobileBinPlacement(layout, width);
      expect(bin.cell).toEqual({ col: layout.cols - 1, row: layout.rows });
      expect(bin.height).toBeGreaterThan(layout.height);
      // Never overlaps an icon and stays inside the container.
      for (const pos of Object.values(layout.positions)) {
        expect(pos.y + 96 <= bin.position.y || pos.x + 88 <= bin.position.x || bin.position.x + 88 <= pos.x).toBe(true);
      }
      expect(bin.position.x + 88).toBeLessThanOrEqual(width);
    }
  });
});
