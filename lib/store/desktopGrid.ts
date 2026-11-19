/**
 * Pure grid geometry for free-placed desktop icons.
 *
 * Like `geometry.ts`, these helpers never touch `window` directly — the caller
 * passes the viewport — so they stay SSR-safe and trivially testable. Icons are
 * stored as discrete grid cells (col/row); this is what makes "never overlap"
 * true by construction: at most one icon per cell.
 */

import { workAreaHeight, type Viewport } from "@/lib/store/geometry";

export interface Cell {
  col: number;
  row: number;
}

/**
 * Distance between adjacent cells — mirrors the `desktop-cell` size token
 * (`--spacing-desktop-cell-x/y` in app/globals.css: 88 × 96px pitch).
 */
export const COL_PITCH = 88;
export const ROW_PITCH = 96;
/** Left inset of the first column (also used as the right margin). */
export const GRID_X = 6;
/** Top of the first row (the work area starts at the screen top). */
export const GRID_TOP = 6;
/**
 * Icon footprint, used only for bounds math: the 76px label width
 * (`--spacing-desktop-label`) × glyph + two label lines.
 */
const ICON_W = 76;
const ICON_H = 88;

/** Viewport assumed when no real one exists yet (SSR / module init). */
export const FALLBACK_VIEWPORT: Viewport = { width: 1440, height: 900 };

function clampInt(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/** How many whole cells fit in the work area (above the taskbar). */
export function gridDims(vp: Viewport): { cols: number; rows: number } {
  const cols = Math.floor((vp.width - 2 * GRID_X - ICON_W) / COL_PITCH) + 1;
  const rows =
    Math.floor((workAreaHeight(vp) - GRID_TOP - ICON_H) / ROW_PITCH) + 1;
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

export function cellKey(cell: Cell): string {
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
 * The classic arrangement: icons fill the first column top-to-bottom from the
 * top-left, wrapping to the next column when the work area runs out of rows.
 * `ids` order is the CTA order from the registry.
 */
export function defaultCells<Id extends string>(
  ids: readonly Id[],
  vp: Viewport,
): Record<Id, Cell> {
  const { rows } = gridDims(vp);
  const cells = {} as Record<Id, Cell>;
  ids.forEach((id, i) => {
    cells[id] = { col: Math.floor(i / rows), row: i % rows };
  });
  return cells;
}

export type Direction = "up" | "down" | "left" | "right";

/**
 * Keyboard navigation across the icon grid: the nearest icon in `dir` from
 * `current`, preferring icons on the same row/column (perpendicular distance
 * weighs 4× the distance travelled). Null when nothing lies that way.
 */
export function neighborIcon<Id extends string>(
  cells: Record<Id, Cell>,
  current: Id,
  dir: Direction,
): Id | null {
  const from = cells[current];
  if (!from) return null;
  let best: Id | null = null;
  let bestScore = Infinity;
  for (const id of Object.keys(cells) as Id[]) {
    if (id === current) continue;
    const c = cells[id];
    const dCol = c.col - from.col;
    const dRow = c.row - from.row;
    const primary =
      dir === "down" ? dRow : dir === "up" ? -dRow : dir === "right" ? dCol : -dCol;
    if (primary <= 0) continue;
    const secondary = dir === "up" || dir === "down" ? Math.abs(dCol) : Math.abs(dRow);
    const score = primary + secondary * 4;
    if (score < bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

/** Icons sorted in reading order for a column-first desktop (col, then row). */
export function iconsInGridOrder<Id extends string>(cells: Record<Id, Cell>): Id[] {
  return (Object.keys(cells) as Id[]).sort((a, b) => {
    const ca = cells[a];
    const cb = cells[b];
    return ca.col - cb.col || ca.row - cb.row;
  });
}
