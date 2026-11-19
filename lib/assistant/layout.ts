import { COL_PITCH, GRID_X, gridDims } from "@/lib/store/desktopGrid";
import { TASKBAR_H, TITLEBAR_H, type Rect, type Viewport } from "@/lib/store/geometry";

/**
 * Where mini Douglas stands and when he must step aside
 * (DESKTOP-INTERFACE-SPEC §13 → Placement). Pure: the caller passes the
 * viewport and the focused window's rect, so it's SSR-safe and testable.
 *
 * Desktop (≥ 768px): the character stands on the taskbar, toward the tray,
 * just left of the desktop grid's last column — the bottom-right cell stays
 * free for the Recycle Bin (stage 6). The bubble sits above him, right-aligned
 * to the screen edge, with its tail pointing down at him.
 */

/** Character box (6:7, the asset aspect ratio — see ASSISTANT-ASSETS.md). */
export const CHARACTER_SIZE = { width: 96, height: 112 } as const;
/** Smaller character on phones. */
export const CHARACTER_SIZE_MOBILE = { width: 60, height: 70 } as const;
/** Bubble width and the height reserved for it (it scrolls beyond that). */
export const BUBBLE_SIZE = { width: 300, maxHeight: 320 } as const;
/** Gaps: character ↔ grid column, bubble ↔ character / screen edge. */
const COLUMN_GAP = 4;
const BUBBLE_GAP = 10;
const EDGE_GAP = 8;

/** The character's rect on a desktop-width viewport. */
export function characterRect(vp: Viewport): Rect {
  const { cols } = gridDims(vp);
  // Left edge of the last grid column; the character ends just before it.
  const lastColumnX = GRID_X + (cols - 1) * COL_PITCH;
  const right = Math.min(vp.width - EDGE_GAP, lastColumnX - COLUMN_GAP);
  const x = Math.max(EDGE_GAP, right - CHARACTER_SIZE.width);
  return {
    x,
    y: vp.height - TASKBAR_H - CHARACTER_SIZE.height,
    width: CHARACTER_SIZE.width,
    height: CHARACTER_SIZE.height,
  };
}

/** The space reserved for the bubble (above the character, right-aligned). */
export function bubbleRect(vp: Viewport): Rect {
  const character = characterRect(vp);
  const width = Math.min(BUBBLE_SIZE.width, vp.width - 2 * EDGE_GAP);
  const bottom = character.y - BUBBLE_GAP;
  const height = Math.min(BUBBLE_SIZE.maxHeight, Math.max(0, bottom - EDGE_GAP));
  // Right-aligned to the screen edge; the character stands within the last
  // ~2 columns, so the tail above him always lands inside the bubble.
  return { x: vp.width - EDGE_GAP - width, y: bottom - height, width, height };
}

/** Horizontal position of the bubble tail, relative to the bubble's left edge. */
export function tailOffset(vp: Viewport): number {
  const character = characterRect(vp);
  const bubble = bubbleRect(vp);
  const center = character.x + character.width / 2 - bubble.x;
  return Math.min(Math.max(center, 16), bubble.width - 16);
}

/** The strip of a window that holds its title and controls. */
export function titleBarRect(window: Rect): Rect {
  return { x: window.x, y: window.y, width: window.width, height: TITLEBAR_H };
}

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export interface AssistantClearance {
  /** The character may be on screen. */
  character: boolean;
  /** The bubble may be on screen. */
  bubble: boolean;
}

/**
 * Golden rule: never cover the focused window's title bar (its controls).
 * If the character would, he steps aside entirely; if only the bubble would,
 * the line waits in the queue until the window moves.
 */
export function assistantClearance(vp: Viewport, focusedWindow: Rect | null): AssistantClearance {
  if (!focusedWindow) return { character: true, bubble: true };
  const bar = titleBarRect(focusedWindow);
  const character = !intersects(characterRect(vp), bar);
  return { character, bubble: character && !intersects(bubbleRect(vp), bar) };
}
