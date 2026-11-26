/**
 * Pure multi-selection helpers for the desktop (stage 6): the lasso
 * (rubber-band) rectangle, which icons it touches, and moving a selected
 * group while keeping the icons' relative offsets. Viewport in, data out —
 * no `window`, no store.
 */

import type { Rect, Viewport } from "@/lib/store/geometry";
import {
  cellKey,
  iconsInGridOrder,
  nearestFreeCell,
  pixelToCell,
  cellToPixel,
  type Cell,
} from "@/lib/store/desktopGrid";
import { iconRect } from "@/lib/store/recycleBin";

/** The rectangle spanned by two pointer positions (any drag direction). */
export function lassoRect(a: { x: number; y: number }, b: { x: number; y: number }): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

/** Do two rectangles overlap (touching edges don't count)? */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/**
 * Icons whose footprint the lasso touches (the classic rule: touching is
 * enough, no need to enclose the whole icon), in grid reading order.
 */
export function iconsInLasso<Id extends string>(
  lasso: Rect,
  cells: Record<Id, Cell>,
  vp: Viewport,
): Id[] {
  return iconsInGridOrder(cells).filter((id) => rectsIntersect(lasso, iconRect(cells[id], vp)));
}

/** Toggle `id` in a selection (Ctrl+click / Ctrl+Space). */
export function toggleInSelection<Id extends string>(selection: readonly Id[], id: Id): Id[] {
  return selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id];
}

/** Union of two selections, keeping first-seen order. */
export function mergeSelections<Id extends string>(a: readonly Id[], b: readonly Id[]): Id[] {
  return [...new Set([...a, ...b])];
}

/**
 * Move a group of icons by the same pixel offset (a drag of one selected icon
 * carries the whole selection). Each icon snaps to the cell nearest its new
 * position; collisions resolve through `nearestFreeCell` in a deterministic
 * order — the dragged icon (`anchor`) first, then the rest in grid reading
 * order — against every icon that isn't moving, the `reserved` cells (the
 * Recycle Bin) and the group members already placed. Returns a new record
 * (or the same one when nothing moved).
 */
export function moveGroup<Id extends string>(
  cells: Record<Id, Cell>,
  ids: readonly NoInfer<Id>[],
  anchor: NoInfer<Id>,
  dx: number,
  dy: number,
  vp: Viewport,
  reserved: readonly Cell[] = [],
): Record<Id, Cell> {
  const moving = new Set(ids.filter((id) => id in cells));
  if (moving.size === 0) return cells;

  const order = iconsInGridOrder(cells).filter((id) => moving.has(id));
  if (moving.has(anchor)) order.sort((a, b) => (a === anchor ? -1 : b === anchor ? 1 : 0));

  const occupied: Cell[] = [...reserved];
  for (const id of Object.keys(cells) as Id[]) {
    if (!moving.has(id)) occupied.push(cells[id]);
  }

  const next = { ...cells };
  let changed = false;
  for (const id of order) {
    const from = cellToPixel(cells[id], vp);
    const target = pixelToCell(from.x + dx, from.y + dy, vp);
    const cell = nearestFreeCell(target, occupied, vp);
    occupied.push(cell);
    if (cellKey(cell) !== cellKey(cells[id])) changed = true;
    next[id] = cell;
  }
  return changed ? next : cells;
}
