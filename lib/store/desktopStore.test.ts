import { beforeEach, describe, expect, it } from "vitest";
import { useDesktopStore } from "@/lib/store/desktopStore";
import { DEFAULT_CELLS, cellToPixel } from "@/lib/store/desktopGrid";

const store = () => useDesktopStore.getState();

const VP = { width: 1440, height: 900 };

describe("desktopStore", () => {
  beforeEach(() => {
    store().resetLayout();
  });

  it("starts from the default arrangement", () => {
    expect(store().iconCells).toEqual(DEFAULT_CELLS);
  });

  it("moveIcon snaps an icon to the grid cell nearest the drop point", () => {
    // Drop "about" onto the pixel origin of an empty target cell.
    const target = { col: 3, row: 2 };
    const px = cellToPixel(target, VP);
    store().moveIcon("about", px.x, px.y);
    expect(store().iconCells.about).toEqual(target);
  });

  it("moveIcon dodges to a free neighbour when the target cell is occupied", () => {
    // "experience" sits at {col:3,row:0}; drop "about" right on top of it.
    const occupied = DEFAULT_CELLS.experience;
    const px = cellToPixel(occupied, VP);
    store().moveIcon("about", px.x, px.y);
    const placed = store().iconCells.about;
    expect(placed).not.toEqual(occupied);
    const dist = Math.max(
      Math.abs(placed.col - occupied.col),
      Math.abs(placed.row - occupied.row),
    );
    expect(dist).toBe(1);
  });

  it("moveIcon is a no-op when the icon lands on its own current cell", () => {
    const before = store().iconCells;
    const own = DEFAULT_CELLS.about;
    const px = cellToPixel(own, VP);
    store().moveIcon("about", px.x, px.y);
    // Same object identity preserved → state unchanged.
    expect(store().iconCells).toBe(before);
  });

  it("resetLayout restores the default cells after a move", () => {
    store().moveIcon("about", 0, 0);
    store().resetLayout();
    expect(store().iconCells).toEqual(DEFAULT_CELLS);
  });
});
