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

/** Icon ids, either flat or split into layout groups (`DESKTOP_ICON_GROUPS`). */
export type IconGroups<Id extends string> = readonly Id[] | readonly (readonly Id[])[];

function toGroups<Id extends string>(ids: IconGroups<Id>): (readonly Id[])[] {
  if (ids.length === 0) return [];
  return Array.isArray(ids[0]) ? [...(ids as readonly (readonly Id[])[])] : [ids as readonly Id[]];
}

/**
 * The classic arrangement: icons fill the first column top-to-bottom from the
 * top-left, wrapping to the next column when the work area runs out of rows.
 * `ids` order is the CTA order from the registry. When `ids` is split into
 * groups, each group starts a fresh column (the external shortcuts get their
 * own column next to the apps instead of trailing under them).
 */
export function defaultCells<Id extends string>(
  ids: IconGroups<Id>,
  vp: Viewport,
): Record<Id, Cell> {
  const { rows } = gridDims(vp);
  const cells = {} as Record<Id, Cell>;
  let startCol = 0;
  for (const group of toGroups(ids)) {
    if (group.length === 0) continue;
    group.forEach((id, i) => {
      cells[id] = { col: startCol + Math.floor(i / rows), row: i % rows };
    });
    startCol += Math.ceil(group.length / rows);
  }
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

/* ------------------------------------------------------------------------ *
 * Mobile (< 768px) icon grid — DESKTOP-INTERFACE-SPEC §11.
 *
 * On phones the icons are laid out like a home screen: larger cells, filled
 * row-first from the top-left (so About, resume.pdf and Contact share the
 * first row), centered horizontally, and never dragged. The layout is purely
 * derived from the container width, so it is never persisted and can't clash
 * with the desktop arrangement saved in `desktopStore`.
 * ------------------------------------------------------------------------ */

/** Viewport width below which the touch shell is used (Tailwind `md`). */
export const MOBILE_BREAKPOINT = 768;

/**
 * Mobile cell pitch — mirrors the mobile `desktop-cell` token
 * (`--spacing-desktop-cell-x/y` under `max-md` in app/globals.css: 96 × 104px).
 */
export const MOBILE_COL_PITCH = 96;
export const MOBILE_ROW_PITCH = 104;
/** Mobile icon footprint: the 88px label width × glyph + two label lines + padding. */
export const MOBILE_ICON_W = 88;
export const MOBILE_ICON_H = 96;
/** Top inset of the first row and minimum side margin. */
export const MOBILE_GRID_TOP = 8;
const MOBILE_MIN_MARGIN = 2;

export function isMobileViewport(vp: Pick<Viewport, "width">): boolean {
  return vp.width < MOBILE_BREAKPOINT;
}

export interface MobileIconLayout<Id extends string> {
  /** Grid cell per icon (row-first). Used for arrow-key navigation. */
  cells: Record<Id, Cell>;
  /** Top-left pixel of each icon inside the desktop container. */
  positions: Record<Id, { x: number; y: number }>;
  cols: number;
  rows: number;
  /** Total content height, so the container can scroll if a short screen needs it. */
  height: number;
}

/**
 * Row-first, horizontally centered icon layout for a container `width` px
 * wide. One icon per cell, so icons can never overlap; when the screen is too
 * short for every row, the container scrolls (see `height`) instead of icons
 * stacking. `ids` order is the CTA order from the registry; when split into
 * groups, each group starts a fresh row (the external shortcuts sit on their
 * own row(s) below the apps, so About / CV / Contact keep the first row).
 */
export function mobileIconLayout<Id extends string>(
  ids: IconGroups<Id>,
  width: number,
): MobileIconLayout<Id> {
  const cols = Math.max(
    1,
    Math.floor((width - 2 * MOBILE_MIN_MARGIN) / MOBILE_COL_PITCH),
  );
  const offsetX =
    Math.max(0, Math.floor((width - cols * MOBILE_COL_PITCH) / 2)) +
    (MOBILE_COL_PITCH - MOBILE_ICON_W) / 2;

  const cells = {} as Record<Id, Cell>;
  const positions = {} as Record<Id, { x: number; y: number }>;
  let startRow = 0;
  for (const group of toGroups(ids)) {
    if (group.length === 0) continue;
    group.forEach((id, i) => {
      const cell = { col: i % cols, row: startRow + Math.floor(i / cols) };
      cells[id] = cell;
      positions[id] = {
        x: offsetX + cell.col * MOBILE_COL_PITCH,
        y: MOBILE_GRID_TOP + cell.row * MOBILE_ROW_PITCH,
      };
    });
    startRow += Math.ceil(group.length / cols);
  }
  const rows = Math.max(1, startRow);

  return {
    cells,
    positions,
    cols,
    rows,
    height: MOBILE_GRID_TOP * 2 + (rows - 1) * MOBILE_ROW_PITCH + MOBILE_ICON_H,
  };
}

/** Icons in row-first reading order (mobile home-screen layout). */
export function iconsInRowOrder<Id extends string>(cells: Record<Id, Cell>): Id[] {
  return (Object.keys(cells) as Id[]).sort((a, b) => {
    const ca = cells[a];
    const cb = cells[b];
    return ca.row - cb.row || ca.col - cb.col;
  });
}
