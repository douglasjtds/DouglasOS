/**
 * Pure geometry for the Recycle Bin (DESKTOP-INTERFACE-SPEC §3 → Recycle Bin,
 * stage 6). Like `desktopGrid.ts`, nothing here touches `window`: the caller
 * passes the viewport (or the mobile layout), so it stays SSR-safe and testable.
 *
 * The bin is not a launcher icon, but it lives on the same grid: it starts in
 * the top-right cell, can be dragged like any icon (its cell is persisted in
 * `desktopStore.binCell`) and every other icon treats its cell as taken.
 * Every hit-test takes the bin's *current* cell.
 */

import { workAreaHeight, type Rect, type Viewport } from "@/lib/store/geometry";
import {
  ICON_H,
  ICON_W,
  MOBILE_COL_PITCH,
  MOBILE_GRID_TOP,
  MOBILE_ICON_H,
  MOBILE_ICON_W,
  MOBILE_ROW_PITCH,
  cellToPixel,
  gridDims,
  type Cell,
  type MobileIconLayout,
} from "@/lib/store/desktopGrid";

/** Stable id of the bin: its desktop item, its window app and its `data-*` hooks. */
export const RECYCLE_BIN_ID = "recycle-bin" as const;
export type RecycleBinId = typeof RECYCLE_BIN_ID;

/**
 * Extra margin around the bin's footprint that still counts as "dropped on
 * the bin", so a slightly-off drop isn't punished with a plain move.
 */
export const BIN_HIT_SLOP = 8;

/**
 * The bin's default cell: the top-right corner of the work area grid, clear
 * of the default icon columns (top-left) and of mini Douglas (bottom-right).
 */
export function defaultBinCell(vp: Viewport): Cell {
  const { cols } = gridDims(vp);
  return { col: cols - 1, row: 0 };
}

/** The footprint (glyph + two label lines) of the icon in `cell`. */
export function iconRect(cell: Cell, vp: Viewport): Rect {
  const { x, y } = cellToPixel(cell, vp);
  return { x, y, width: ICON_W, height: ICON_H };
}

/** The area that accepts a drop: the bin's footprint (at `cell`) plus `BIN_HIT_SLOP`. */
export function binHitRect(cell: Cell, vp: Viewport): Rect {
  const r = iconRect(cell, vp);
  return {
    x: r.x - BIN_HIT_SLOP,
    y: r.y - BIN_HIT_SLOP,
    width: r.width + 2 * BIN_HIT_SLOP,
    height: r.height + 2 * BIN_HIT_SLOP,
  };
}

export function pointInRect(point: { x: number; y: number }, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Drop hit-test: is the pointer (where the visitor let go, like the classic
 * desktop's drop target) over the bin sitting on `cell`?
 */
export function hitsBin(point: { x: number; y: number }, cell: Cell, vp: Viewport): boolean {
  return pointInRect(point, binHitRect(cell, vp));
}

/**
 * Where the bin sits on the touch layout (< 768px): a trailing row of its own
 * below every launcher, in the right-most column, so About / CV / Contact keep
 * the first row (the desktop's top-right default would push them down).
 * Never dragged, never persisted. Returns its cell, top-left pixel and the content
 * height including that row.
 */
export function mobileBinPlacement<Id extends string>(
  layout: MobileIconLayout<Id>,
  width: number,
): { cell: Cell; position: { x: number; y: number }; height: number } {
  const cell = { col: layout.cols - 1, row: layout.rows };
  // Same horizontal centering as `mobileIconLayout`.
  const offsetX =
    Math.max(0, Math.floor((width - layout.cols * MOBILE_COL_PITCH) / 2)) +
    (MOBILE_COL_PITCH - MOBILE_ICON_W) / 2;
  const position = {
    x: offsetX + cell.col * MOBILE_COL_PITCH,
    y: MOBILE_GRID_TOP + cell.row * MOBILE_ROW_PITCH,
  };
  return {
    cell,
    position,
    height: MOBILE_GRID_TOP * 2 + cell.row * MOBILE_ROW_PITCH + MOBILE_ICON_H,
  };
}

/** Gap between the bin and its balloon, and between the balloon and the screen edge. */
const BALLOON_GAP = 10;
const BALLOON_EDGE = 8;
/** How far right of the bin's centre the balloon may reach (XP balloons grow left of the tail). */
const BALLOON_TAIL_INSET = 24;

export interface BinBalloonPlacement {
  /** Left edge and width (px, shell coordinates). */
  x: number;
  width: number;
  /** Balloon above the bin (anchored by its bottom) or below it (by its top). */
  side: "above" | "below";
  /** `bottom` (above) or `top` (below) offset, in CSS terms. */
  offset: number;
  maxHeight: number;
  /** Tail position from the balloon's left edge. */
  tailX: number;
}

/**
 * Where the bin's own rescue balloon (`TrashNotice`) goes on the desktop:
 * anchored to the bin's *current* cell, above it when there's room (the
 * classic look), otherwise below it — the top-right default — and shifted
 * left/right so it always stays on screen, with the tail pointing at the bin.
 */
export function binBalloonPlacement(
  cell: Cell,
  vp: Viewport,
  size: { width: number; maxHeight: number },
): BinBalloonPlacement {
  const bin = iconRect(cell, vp);
  const width = Math.min(size.width, vp.width - 2 * BALLOON_EDGE);
  const center = bin.x + bin.width / 2;
  const x = Math.min(
    Math.max(center + BALLOON_TAIL_INSET - width, BALLOON_EDGE),
    vp.width - BALLOON_EDGE - width,
  );
  const tailX = Math.min(Math.max(center - x, 16), width - 16);

  const spaceAbove = bin.y - BALLOON_GAP - BALLOON_EDGE;
  const below = bin.y + bin.height + BALLOON_GAP;
  const spaceBelow = workAreaHeight(vp) - below - BALLOON_EDGE;
  if (spaceAbove >= size.maxHeight || spaceAbove >= spaceBelow) {
    return {
      x,
      width,
      side: "above",
      offset: vp.height - (bin.y - BALLOON_GAP),
      maxHeight: Math.min(size.maxHeight, Math.max(0, spaceAbove)),
      tailX,
    };
  }
  return {
    x,
    width,
    side: "below",
    offset: below,
    maxHeight: Math.min(size.maxHeight, Math.max(0, spaceBelow)),
    tailX,
  };
}
