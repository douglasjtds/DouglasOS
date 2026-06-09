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

/** Sticky menu bar height (keep windows below it). */
export const MENU_BAR_H = 36;
/** Vertical space reserved at the bottom for the dock + its margin. */
export const DOCK_RESERVED = 96;
/** Inset used by the maximized state (≈90% viewport, "not full"). */
export const MAXIMIZE_MARGIN = 20;
/** Per-open diagonal offset so stacked windows don't perfectly overlap. */
export const CASCADE = 28;
/** How many cascade steps before wrapping back to center. */
export const CASCADE_WRAP = 6;
/** Minimum on-screen width/height kept grabbable when dragged off-edge. */
const GRAB_MARGIN = 120;

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/** Center a window in the area between the menu bar and the dock. */
export function centerRect(size: Size, vp: Viewport): Rect {
  const usableTop = MENU_BAR_H;
  const usableHeight = vp.height - MENU_BAR_H - DOCK_RESERVED;
  const x = Math.round((vp.width - size.width) / 2);
  const y = Math.round(usableTop + (usableHeight - size.height) / 2);
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

/** The maximized rect — inset from every edge (≈90%), never full-screen. */
export function maximizeRect(vp: Viewport): Rect {
  return {
    x: MAXIMIZE_MARGIN,
    y: MENU_BAR_H + 8,
    width: vp.width - MAXIMIZE_MARGIN * 2,
    height: vp.height - (MENU_BAR_H + 8) - DOCK_RESERVED,
  };
}

/**
 * Keep a window reachable: its title bar must stay below the menu bar and
 * above the dock, and at least GRAB_MARGIN px must remain horizontally
 * on-screen. Used live during drag and as the off-screen snap-back on release.
 */
export function clampPosition(
  x: number,
  y: number,
  size: Size,
  vp: Viewport,
): { x: number; y: number } {
  const minX = -(size.width - GRAB_MARGIN);
  const maxX = vp.width - GRAB_MARGIN;
  const minY = MENU_BAR_H;
  const maxY = vp.height - DOCK_RESERVED + (DOCK_RESERVED - 40);
  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, Math.max(minY, maxY)),
  };
}

/** Clamp an entire rect's position (size unchanged — resize is out of scope). */
export function clampRect(rect: Rect, vp: Viewport): Rect {
  const { x, y } = clampPosition(rect.x, rect.y, rect, vp);
  return { ...rect, x, y };
}
