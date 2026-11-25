import { describe, expect, it } from "vitest";
import { gridDims, mobileIconLayout, cellToPixel } from "@/lib/store/desktopGrid";
import { BIN_HIT_SLOP, binCell, binHitRect, hitsBin, iconRect, mobileBinPlacement } from "@/lib/store/recycleBin";
import { DESKTOP_ICON_GROUPS } from "@/lib/apps/registry";

const VP = { width: 1440, height: 900 };

describe("recycleBin geometry", () => {
  it("pins the bin to the bottom-right cell of the grid", () => {
    const { cols, rows } = gridDims(VP);
    expect(binCell(VP)).toEqual({ col: cols - 1, row: rows - 1 });
    expect(binCell({ width: 800, height: 600 })).toEqual({
      col: gridDims({ width: 800, height: 600 }).cols - 1,
      row: gridDims({ width: 800, height: 600 }).rows - 1,
    });
  });

  it("hit-tests a drop point against the bin's footprint plus slop", () => {
    const r = iconRect(binCell(VP), VP);
    expect(hitsBin({ x: r.x + r.width / 2, y: r.y + r.height / 2 }, VP)).toBe(true);
    expect(hitsBin({ x: r.x - BIN_HIT_SLOP, y: r.y }, VP)).toBe(true);
    expect(hitsBin({ x: r.x - BIN_HIT_SLOP - 1, y: r.y }, VP)).toBe(false);
    expect(hitsBin({ x: r.x + r.width / 2, y: r.y + r.height + BIN_HIT_SLOP + 1 }, VP)).toBe(false);
    // The top-left icon is nowhere near.
    expect(hitsBin(cellToPixel({ col: 0, row: 0 }, VP), VP)).toBe(false);
    expect(binHitRect(VP).width).toBe(r.width + 2 * BIN_HIT_SLOP);
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
