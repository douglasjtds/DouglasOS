import { describe, expect, it } from "vitest";
import {
  COL_PITCH,
  GRID_TOP,
  GRID_X,
  ROW_PITCH,
  cellToPixel,
  defaultCells,
  gridDims,
  MOBILE_ICON_H,
  MOBILE_ICON_W,
  iconsInGridOrder,
  iconsInRowOrder,
  isMobileViewport,
  mobileIconLayout,
  nearestFreeCell,
  neighborIcon,
  pixelToCell,
  type Cell,
} from "@/lib/store/desktopGrid";
import { TASKBAR_H, type Viewport } from "@/lib/store/geometry";
import { DESKTOP_ICON_GROUPS, DESKTOP_ICON_IDS } from "@/lib/apps/registry";

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

  it("starts each group in a fresh column", () => {
    const cells = defaultCells([["a", "b", "c"], ["x", "y"]], VP);
    expect(cells.c).toEqual({ col: 0, row: 2 });
    expect(cells.x).toEqual({ col: 1, row: 0 });
    expect(cells.y).toEqual({ col: 1, row: 1 });
  });

  it("starts the next group after a group that wrapped", () => {
    const short: Viewport = { width: 1024, height: 600 };
    const { rows } = gridDims(short);
    const cells = defaultCells([ids, ["x"]], short);
    expect(cells.x).toEqual({ col: Math.ceil(ids.length / rows), row: 0 });
  });
});

describe("default desktop layout (registry groups)", () => {
  const VIEWPORTS: Viewport[] = [
    VP,
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 1024, height: 600 },
    { width: 768, height: 600 },
  ];

  it("gives every desktop icon a distinct in-grid cell on common screens", () => {
    for (const vp of VIEWPORTS) {
      const cells = defaultCells(DESKTOP_ICON_GROUPS, vp);
      const { cols, rows } = gridDims(vp);
      const keys = DESKTOP_ICON_IDS.map((id) => {
        const c = cells[id];
        expect(c.col).toBeLessThan(cols);
        expect(c.row).toBeLessThan(rows);
        return `${c.col},${c.row}`;
      });
      expect(new Set(keys).size).toBe(DESKTOP_ICON_IDS.length);
    }
  });

  it("keeps the apps in the first column and the links in the next one", () => {
    const cells = defaultCells(DESKTOP_ICON_GROUPS, VP);
    expect(cells.about).toEqual({ col: 0, row: 0 });
    expect(cells.resume).toEqual({ col: 0, row: 1 });
    expect(cells.contact).toEqual({ col: 0, row: 2 });
    expect(cells.linkedin).toEqual({ col: 1, row: 0 });
    expect(cells.github).toEqual({ col: 1, row: 1 });
    expect(cells.whatsapp).toEqual({ col: 1, row: 2 });
    expect(cells.email).toEqual({ col: 1, row: 3 });
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

describe("mobile icon grid", () => {
  const IDS = [
    "about",
    "resume",
    "contact",
    "projects",
    "experience",
    "skills",
    "how-i-work-with-ai",
  ] as const;
  // Common phone widths: iPhone SE/mini, iPhone 13/14, Pixel 7, small tablet portrait.
  const WIDTHS = [320, 360, 375, 390, 412, 430, 600, 767];

  function overlaps(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): boolean {
    return (
      a.x < b.x + MOBILE_ICON_W &&
      b.x < a.x + MOBILE_ICON_W &&
      a.y < b.y + MOBILE_ICON_H &&
      b.y < a.y + MOBILE_ICON_H
    );
  }

  it("uses the touch shell below 768px only", () => {
    expect(isMobileViewport({ width: 390 })).toBe(true);
    expect(isMobileViewport({ width: 767 })).toBe(true);
    expect(isMobileViewport({ width: 768 })).toBe(false);
  });

  it.each(WIDTHS)("never overlaps two icons and stays inside %ipx", (width) => {
    const { positions } = mobileIconLayout(IDS, width);
    const rects = IDS.map((id) => positions[id]);
    for (let i = 0; i < rects.length; i++) {
      expect(rects[i].x).toBeGreaterThanOrEqual(0);
      expect(rects[i].x + MOBILE_ICON_W).toBeLessThanOrEqual(width);
      for (let j = i + 1; j < rects.length; j++) {
        expect(overlaps(rects[i], rects[j])).toBe(false);
      }
    }
  });

  it("gives every icon its own cell", () => {
    const { cells } = mobileIconLayout(IDS, 390);
    const keys = new Set(IDS.map((id) => `${cells[id].col},${cells[id].row}`));
    expect(keys.size).toBe(IDS.length);
  });

  it("fills row-first so the CV sits in the first row", () => {
    const layout = mobileIconLayout(IDS, 390);
    expect(layout.cols).toBe(4);
    expect(layout.rows).toBe(2);
    expect(layout.cells.about).toEqual({ col: 0, row: 0 });
    expect(layout.cells.resume).toEqual({ col: 1, row: 0 });
    expect(layout.cells.contact).toEqual({ col: 2, row: 0 });
    expect(layout.cells.projects).toEqual({ col: 3, row: 0 });
    expect(layout.cells.experience).toEqual({ col: 0, row: 1 });
    expect(iconsInRowOrder(layout.cells)).toEqual([...IDS]);
  });

  it("has fewer columns than the desktop grid and centers them", () => {
    const narrow = mobileIconLayout(IDS, 360);
    expect(narrow.cols).toBe(3);
    const first = narrow.positions.about.x;
    const last = narrow.positions.contact.x + MOBILE_ICON_W;
    expect(first).toBe(360 - last);
  });

  it("keeps About, CV and Contact in the first row with the links on later rows, no overlap", () => {
    for (const width of WIDTHS) {
      const layout = mobileIconLayout(DESKTOP_ICON_GROUPS, width);
      expect(layout.cells.about.row).toBe(0);
      expect(layout.cells.resume.row).toBe(0);
      expect(layout.cells.contact.row).toBe(0);
      const appRows = Math.max(...DESKTOP_ICON_GROUPS[0].map((id) => layout.cells[id].row));
      for (const id of DESKTOP_ICON_GROUPS[1]) {
        expect(layout.cells[id].row).toBeGreaterThan(appRows);
      }
      const rects = DESKTOP_ICON_IDS.map((id) => layout.positions[id]);
      for (let i = 0; i < rects.length; i++) {
        expect(rects[i].x + MOBILE_ICON_W).toBeLessThanOrEqual(width);
        for (let j = i + 1; j < rects.length; j++) {
          expect(overlaps(rects[i], rects[j])).toBe(false);
        }
      }
      expect(layout.height).toBeGreaterThanOrEqual(
        Math.max(...rects.map((r) => r.y)) + MOBILE_ICON_H,
      );
    }
  });

  it("starts the links on a fresh row on a 390px phone", () => {
    const layout = mobileIconLayout(DESKTOP_ICON_GROUPS, 390);
    expect(layout.cells.linkedin).toEqual({ col: 0, row: 2 });
    expect(layout.cells.email).toEqual({ col: 3, row: 2 });
    // The fun apps start a row of their own after the links.
    expect(layout.cells["media-player"]).toEqual({ col: 0, row: 3 });
    expect(layout.rows).toBe(4);
  });

  it("degrades to a single scrolling column on a very narrow container", () => {
    const layout = mobileIconLayout(IDS, 100);
    expect(layout.cols).toBe(1);
    expect(layout.rows).toBe(IDS.length);
    expect(layout.height).toBeGreaterThan(layout.positions["how-i-work-with-ai"].y);
  });
});
