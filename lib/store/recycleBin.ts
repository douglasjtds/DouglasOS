/**
 * Pure geometry for the Recycle Bin (DESKTOP-INTERFACE-SPEC §3 → Recycle Bin,
 * stage 6). Like `desktopGrid.ts`, nothing here touches `window`: the caller
 * passes the viewport (or the mobile layout), so it stays SSR-safe and testable.
 *
 * The bin is not a launcher icon: it is pinned to the bottom-right cell of
 * the desktop grid (never dragged, never persisted) and every other icon
 * treats that cell as taken.
 */

import type { Rect, Viewport } from "@/lib/store/geometry";
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

/** The bin's cell: the bottom-right corner of the work area grid. */
export function binCell(vp: Viewport): Cell {
  const { cols, rows } = gridDims(vp);
  return { col: cols - 1, row: rows - 1 };
}

/** The footprint (glyph + two label lines) of the icon in `cell`. */
export function iconRect(cell: Cell, vp: Viewport): Rect {
  const { x, y } = cellToPixel(cell, vp);
  return { x, y, width: ICON_W, height: ICON_H };
}

/** The area that accepts a drop: the bin's footprint plus `BIN_HIT_SLOP`. */
export function binHitRect(vp: Viewport): Rect {
  const r = iconRect(binCell(vp), vp);
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
 * desktop's drop target) over the bin?
 */
export function hitsBin(point: { x: number; y: number }, vp: Viewport): boolean {
  return pointInRect(point, binHitRect(vp));
}

/**
 * Where the bin sits on the touch layout (< 768px): a trailing row of its own
 * below every launcher, in the right-most column — the phone's version of
 * "bottom-right corner". Returns its cell, top-left pixel and the content
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
