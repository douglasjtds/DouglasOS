/**
 * Pure grid geometry for free-placed desktop icons.
 *
 * Like `geometry.ts`, these helpers never touch `window` directly — the caller
 * passes the viewport — so they stay SSR-safe and trivially testable. Icons are
 * stored as discrete grid cells (col/row); this is what makes "never overlap"
 * true by construction: at most one icon per cell.
 */

import { MENU_BAR_H, DOCK_RESERVED, type Viewport } from "@/lib/store/geometry";
import type { LauncherId } from "@/lib/apps/registry";

export interface Cell {
  col: number;
  row: number;
}

/** Horizontal/vertical distance between adjacent cells (icon footprint + gap). */
export const COL_PITCH = 112;
export const ROW_PITCH = 124;
/** Left inset of the first column (also used as the right margin). */
export const GRID_X = 32;
/** Top of the first row — clear of the menu bar. */
export const GRID_TOP = MENU_BAR_H + 20;
/** Icon footprint, used only for bounds math (matches the `w-24` button). */
const ICON_W = 96;
const ICON_H = 104;

function clampInt(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/** How many whole cells fit between the menu bar/edges and the dock. */
export function gridDims(vp: Viewport): { cols: number; rows: number } {
  const cols =
    Math.floor((vp.width - 2 * GRID_X - ICON_W) / COL_PITCH) + 1;
  const rows =
    Math.floor((vp.height - GRID_TOP - DOCK_RESERVED - ICON_H) / ROW_PITCH) + 1;
  return { cols: Math.max(1, cols), rows: Math.max(1, rows) };
}

/** Top-left pixel of a cell, clamped so it always stays within the grid. */
export function cellToPixel(cell: Cell, vp: Viewport): { x: number; y: number } {
  const { cols, rows } = gridDims(vp);
  const col = clampInt(cell.col, 0, cols - 1);
  const row = clampInt(cell.row, 0, rows - 1);
  return { x: GRID_X + col * COL_PITCH, y: GRID_TOP + row * ROW_PITCH };
}

/** Nearest cell to a top-left pixel position, clamped to the grid. */
export function pixelToCell(x: number, y: number, vp: Viewport): Cell {
  const { cols, rows } = gridDims(vp);
  const col = clampInt(Math.round((x - GRID_X) / COL_PITCH), 0, cols - 1);
  const row = clampInt(Math.round((y - GRID_TOP) / ROW_PITCH), 0, rows - 1);
  return { col, row };
}

function cellKey(cell: Cell): string {
  return `${cell.col},${cell.row}`;
}

/**
 * The free cell closest to `target` that no other icon occupies. Searches in
 * expanding Chebyshev rings, so a drop onto an occupied cell lands in the
 * nearest empty neighbour rather than stacking. Returns `target` if it's free
 * (or as a last-resort fallback).
 */
export function nearestFreeCell(
  target: Cell,
  occupied: Cell[],
  vp: Viewport,
): Cell {
  const taken = new Set(occupied.map(cellKey));
  if (!taken.has(cellKey(target))) return target;

  const { cols, rows } = gridDims(vp);
  const maxRadius = Math.max(cols, rows);
  for (let r = 1; r <= maxRadius; r++) {
    for (let dc = -r; dc <= r; dc++) {
      for (let dr = -r; dr <= r; dr++) {
        // Only the ring at exactly Chebyshev distance r (skip the interior).
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== r) continue;
        const col = target.col + dc;
        const row = target.row + dr;
        if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
        const cell = { col, row };
        if (!taken.has(cellKey(cell))) return cell;
      }
    }
  }
  return target;
}

/**
 * Default arrangement — an intentionally scattered, organic layout (not a tidy
 * corner block), mirroring the original free placement. Every launcher appears
 * exactly once with no shared cell. Cols are kept within 0–5 and rows within
 * 0–2 so the cells stay distinct even after clamping on the smallest desktop
 * viewport (~768×600), which guarantees icons never collapse onto each other.
 */
export const DEFAULT_CELLS: Record<LauncherId, Cell> = {
  about: { col: 0, row: 0 },
  experience: { col: 3, row: 0 },
  projects: { col: 1, row: 1 },
  "how-i-work-with-ai": { col: 4, row: 1 },
  contact: { col: 5, row: 1 },
  skills: { col: 0, row: 2 },
  resume: { col: 2, row: 2 },
};
