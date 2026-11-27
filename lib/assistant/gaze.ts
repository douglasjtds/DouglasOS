import type { AssistantState } from "@/lib/store/assistantStore";
import type { Rect } from "@/lib/store/geometry";

/**
 * mini Douglas follows the mouse (DESKTOP-INTERFACE-SPEC §13 → Cursor gaze):
 * his eyes look at the cursor, his head tilts a little toward it, and his face
 * reacts to what the cursor does. Pure math — the DOM side lives in
 * `hooks/useCursorGaze.ts`. Placeholder-only: the recorded clips can't move
 * their eyes, so `VideoCharacter` ignores all of this.
 */

/** The face mini Douglas makes because of the cursor. */
export type CharacterExpression = "neutral" | "curious" | "happy" | "sleepy" | "surprised";

export const GAZE_TUNING = {
  /** Max eye travel, in SVG units of the 96×112 character box. */
  eyeMaxX: 2.2,
  eyeMaxY: 1.6,
  /** Max head tilt toward the cursor, in degrees. */
  maxTilt: 6,
  /** Distance (CSS px) at which the eyes reach their full offset. */
  gazeFullAt: 160,
  /** Horizontal distance (CSS px) at which the head reaches its full tilt. */
  tiltFullAt: 480,
  /** Cursor closer than this (CSS px from his box) makes him curious. */
  curiousRadius: 200,
  /** Smoothed cursor speed (px/ms) that startles him… */
  surprisedSpeed: 2.5,
  /** …but only when it zips by within this distance (CSS px from his box). */
  surprisedRadius: 320,
  /** How long the surprised face lasts, and the pause before the next one. */
  surprisedMs: 1000,
  surprisedCooldownMs: 4000,
  /**
   * Mouse and keyboard still this long → sleepy. Shorter than the 30s
   * "Still around?" trigger, so he dozes off before he asks.
   */
  sleepyMs: 15_000,
} as const;

export interface Point {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Center of a rect. */
export function rectCenter(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** Whether `point` is inside `rect` (edges included). */
export function pointInRect(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/** Distance from `point` to the nearest edge of `rect` (0 inside it). */
export function distanceToRect(rect: Rect, point: Point): number {
  const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
  const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
  return Math.hypot(dx, dy);
}

/**
 * Where the eyes look, normalized to −1..1 on each axis: the direction toward
 * the pointer, scaled up with distance until `gazeFullAt` (so a cursor right
 * on his face doesn't make him cross-eyed). Multiply by `eyeMaxX/Y` to draw.
 */
export function gazeOffset(center: Point, pointer: Point): Point {
  const dx = pointer.x - center.x;
  const dy = pointer.y - center.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return { x: 0, y: 0 };
  const reach = clamp(distance / GAZE_TUNING.gazeFullAt, 0, 1);
  return { x: (dx / distance) * reach, y: (dy / distance) * reach };
}

/** Head tilt toward the pointer, in degrees (positive = clockwise, to his left). */
export function headTilt(center: Point, pointer: Point): number {
  const ratio = clamp((pointer.x - center.x) / GAZE_TUNING.tiltFullAt, -1, 1);
  return ratio * GAZE_TUNING.maxTilt;
}

export interface ExpressionInput {
  /** The assistant's own state: talking and dancing override some faces. */
  state: AssistantState;
  /** The cursor is over the character. */
  hovering: boolean;
  /** Cursor distance to the character's box (CSS px); `Infinity` when unknown/outside the page. */
  distance: number;
  /** A "surprised" reaction is running. */
  surprised: boolean;
  /** Time since the last mouse/keyboard input (ms). */
  idleMs: number;
}

/**
 * Which face to make. Priority: hover (happy) → a running surprise → nothing
 * for a while (sleepy, even with the cursor parked nearby) → cursor nearby
 * (curious) → neutral. While dancing he
 * keeps his dance face, mid-kickflip he's all eyes; while talking he can only light up or be startled —
 * never dozes off or squints in the middle of a line.
 */
export function pickExpression(input: ExpressionInput): CharacterExpression {
  if (input.state === "dancing") return "neutral";
  if (input.state === "kickflipping") return "surprised";
  if (input.hovering) return "happy";
  if (input.surprised) return "surprised";
  if (input.state === "talking") return "neutral";
  if (input.idleMs >= GAZE_TUNING.sleepyMs) return "sleepy";
  if (input.distance < GAZE_TUNING.curiousRadius) return "curious";
  return "neutral";
}

/**
 * Whether a cursor movement should startle him: fast enough, close enough,
 * and not too soon after the previous surprise.
 */
export function shouldStartle(speed: number, distance: number, msSinceLastSurprise: number): boolean {
  return (
    speed >= GAZE_TUNING.surprisedSpeed &&
    distance < GAZE_TUNING.surprisedRadius &&
    msSinceLastSurprise >= GAZE_TUNING.surprisedMs + GAZE_TUNING.surprisedCooldownMs
  );
}
