/**
 * Pure viewport geometry for the window manager.
 *
 * These helpers never touch `window` directly — the caller passes viewport
 * dimensions — so they're trivially testable and SSR-safe. The store reads
 * `window.innerWidth/Height` lazily (client-only) and feeds them in.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

/**
 * Taskbar height at the bottom of the screen — mirrors the `taskbar` size token
 * (`--spacing-taskbar` in app/globals.css). The work area is everything above it.
 */
export const TASKBAR_H = 30;
/** Window title bar height — mirrors the `titlebar` size token. */
export const TITLEBAR_H = 30;
/** Per-open diagonal offset so stacked windows don't perfectly overlap. */
export const CASCADE = 28;
/** How many cascade steps before wrapping back to center. */
export const CASCADE_WRAP = 6;
/** Minimum on-screen width/height kept grabbable when dragged off-edge. */
const GRAB_MARGIN = 120;
/** Smallest a window may be resized to (per DESKTOP-INTERFACE-SPEC). */
export const MIN_WIDTH = 400;
export const MIN_HEIGHT = 300;

/** Which edge(s) a resize drag is acting on. */
export type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/** Height of the work area (the screen minus the taskbar). */
export function workAreaHeight(vp: Viewport): number {
  return vp.height - TASKBAR_H;
}

/** Center a window in the work area (above the taskbar). */
export function centerRect(size: Size, vp: Viewport): Rect {
  const x = Math.round((vp.width - size.width) / 2);
  const y = Math.round((workAreaHeight(vp) - size.height) / 2);
  return clampRect(
    { x, y, width: size.width, height: size.height },
    vp,
  );
}

/**
 * Initial placement: centered on the first open, then a diagonal cascade for
 * subsequent opens (wrapping so it never marches off-screen).
 */
export function initialRect(size: Size, openIndex: number, vp: Viewport): Rect {
  const base = centerRect(size, vp);
  const step = openIndex % CASCADE_WRAP;
  return clampRect(
    {
      x: base.x + step * CASCADE,
      y: base.y + step * CASCADE,
      width: size.width,
      height: size.height,
    },
    vp,
  );
}

/**
 * The maximized rect — fills the whole work area: full width, from the top edge
 * down to the taskbar (the faithful Luna-era behavior).
 */
export function maximizeRect(vp: Viewport): Rect {
  return { x: 0, y: 0, width: vp.width, height: workAreaHeight(vp) };
}

/**
 * Keep a window reachable: its title bar must stay within the work area (never
 * above the top edge, never hidden behind the taskbar), and at least
 * GRAB_MARGIN px must remain horizontally on-screen. Used live during drag and as the off-screen snap-back on release.
 */
export function clampPosition(
  x: number,
  y: number,
  size: Size,
  vp: Viewport,
): { x: number; y: number } {
  const minX = -(size.width - GRAB_MARGIN);
  const maxX = vp.width - GRAB_MARGIN;
  const minY = 0;
  const maxY = workAreaHeight(vp) - TITLEBAR_H;
  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, Math.max(minY, maxY)),
  };
}

/** Clamp an entire rect's position (size unchanged — see clampSize for sizing). */
export function clampRect(rect: Rect, vp: Viewport): Rect {
  const { x, y } = clampPosition(rect.x, rect.y, rect, vp);
  return { ...rect, x, y };
}

/**
 * Clamp a rect's width/height to the window min/max. Max height is the work
 * area (screen minus taskbar); max width is the viewport. Used when
 * rehydrating persisted windows so a smaller screen can't leave them oversized.
 */
export function clampSize(rect: Rect, vp: Viewport): Rect {
  const maxW = Math.max(MIN_WIDTH, vp.width);
  const maxH = Math.max(MIN_HEIGHT, workAreaHeight(vp));
  return {
    ...rect,
    width: clamp(rect.width, MIN_WIDTH, maxW),
    height: clamp(rect.height, MIN_HEIGHT, maxH),
  };
}

/**
 * Resize a rect by moving only the dragged edge(s). Each named edge slides by
 * `dx`/`dy` while the opposite edge stays anchored, so hitting the min size
 * pins the far edge rather than dragging the whole window. Edges are bounded by
 * the work area: top at or below the screen top, bottom above the taskbar,
 * sides within the viewport.
 */
export function resizeRect(
  origin: Rect,
  edge: Edge,
  dx: number,
  dy: number,
  vp: Viewport,
): Rect {
  let left = origin.x;
  let top = origin.y;
  let rightEdge = origin.x + origin.width;
  let bottomEdge = origin.y + origin.height;

  if (edge.includes("e")) {
    rightEdge = clamp(rightEdge + dx, left + MIN_WIDTH, vp.width);
  }
  if (edge.includes("w")) {
    left = clamp(left + dx, 0, rightEdge - MIN_WIDTH);
  }
  if (edge.includes("s")) {
    bottomEdge = clamp(bottomEdge + dy, top + MIN_HEIGHT, workAreaHeight(vp));
  }
  if (edge.includes("n")) {
    top = clamp(top + dy, 0, bottomEdge - MIN_HEIGHT);
  }

  return {
    x: left,
    y: top,
    width: rightEdge - left,
    height: bottomEdge - top,
  };
}
