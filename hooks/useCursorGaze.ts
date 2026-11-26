import { useEffect, useRef, useState, type RefObject } from "react";
import { useMotionValue, useSpring, type MotionValue } from "framer-motion";
import type { AssistantState } from "@/lib/store/assistantStore";
import type { Rect } from "@/lib/store/geometry";
import {
  GAZE_TUNING,
  distanceToRect,
  gazeOffset,
  headTilt,
  pickExpression,
  pointInRect,
  rectCenter,
  shouldStartle,
  type CharacterExpression,
  type Point,
} from "@/lib/assistant/gaze";

/** What the character renderer needs to look at the cursor. */
export interface CursorGaze {
  /** Eye direction, −1..1 per axis (smoothed). */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Head tilt in degrees (smoothed). */
  tilt: MotionValue<number>;
  expression: CharacterExpression;
}

interface Options {
  /** Off on phones, under reduced motion, while dancing or off screen. */
  enabled: boolean;
  state: AssistantState;
}

const SPRING = { stiffness: 220, damping: 24, mass: 0.6 };

function now() {
  return performance.now();
}

function toRect(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}

function nextFrame(callback: () => void): () => void {
  if (typeof requestAnimationFrame === "function") {
    const id = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(callback, 16);
  return () => clearTimeout(id);
}

/**
 * mini Douglas watches the mouse (DESKTOP-INTERFACE-SPEC §13 → Cursor gaze).
 * One passive `pointermove` listener, coalesced to one update per frame: the
 * eye/tilt values are Framer Motion springs (no React re-render per move);
 * only the expression — which changes rarely — is React state. Touch and pen
 * input are ignored, so phones never get it.
 */
export function useCursorGaze(target: RefObject<HTMLElement | null>, { enabled, state }: Options): CursorGaze {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawTilt = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);
  const tilt = useSpring(rawTilt, SPRING);
  const [expression, setExpression] = useState<CharacterExpression>("neutral");

  const stateRef = useRef(state);
  // Re-evaluates the face; set while the listeners are live.
  const evaluateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
    evaluateRef.current?.();
  }, [state]);

  useEffect(() => {
    if (!enabled) return;

    let pointer: Point | null = null;
    let sample: { x: number; y: number; t: number } | null = null;
    let speed = 0;
    let lastInput = now();
    let surprisedUntil = 0;
    let lastSurprise = -Infinity;
    let cancelFrame: (() => void) | null = null;
    let sleepyTimer: ReturnType<typeof setTimeout> | null = null;
    let surpriseTimer: ReturnType<typeof setTimeout> | null = null;

    function measure() {
      const el = target.current;
      if (!el || !pointer) return { rect: null, hovering: false, distance: Infinity };
      const rect = toRect(el);
      return { rect, hovering: pointInRect(rect, pointer), distance: distanceToRect(rect, pointer) };
    }

    function evaluate() {
      const t = now();
      const { hovering, distance } = measure();
      const next = pickExpression({
        state: stateRef.current,
        hovering,
        distance,
        surprised: t < surprisedUntil,
        idleMs: t - lastInput,
      });
      setExpression((prev) => (prev === next ? prev : next));
    }
    evaluateRef.current = evaluate;

    function scheduleSleep() {
      if (sleepyTimer) clearTimeout(sleepyTimer);
      sleepyTimer = setTimeout(evaluate, GAZE_TUNING.sleepyMs);
    }

    function frame() {
      cancelFrame = null;
      const t = now();
      const { rect, distance } = measure();
      if (rect && pointer) {
        const center = rectCenter(rect);
        const gaze = gazeOffset(center, pointer);
        rawX.set(gaze.x);
        rawY.set(gaze.y);
        rawTilt.set(headTilt(center, pointer));
        if (shouldStartle(speed, distance, t - lastSurprise)) {
          lastSurprise = t;
          surprisedUntil = t + GAZE_TUNING.surprisedMs;
          if (surpriseTimer) clearTimeout(surpriseTimer);
          surpriseTimer = setTimeout(evaluate, GAZE_TUNING.surprisedMs + 1);
        }
      }
      scheduleSleep();
      evaluate();
    }

    function onPointerMove(e: PointerEvent) {
      // jsdom and some synthetic events carry no pointerType: treat as mouse.
      if (e.pointerType && e.pointerType !== "mouse") return;
      const t = now();
      if (sample) {
        const dt = Math.max(t - sample.t, 1);
        const instant = Math.hypot(e.clientX - sample.x, e.clientY - sample.y) / dt;
        speed = dt > 120 ? instant : speed * 0.5 + instant * 0.5;
      }
      sample = { x: e.clientX, y: e.clientY, t };
      pointer = { x: e.clientX, y: e.clientY };
      lastInput = t;
      if (!cancelFrame) cancelFrame = nextFrame(frame);
    }

    function onKeyDown() {
      lastInput = now();
      scheduleSleep();
      evaluate();
    }

    // The cursor left the page: look back at the visitor.
    function onLeave() {
      pointer = null;
      sample = null;
      speed = 0;
      rawX.set(0);
      rawY.set(0);
      rawTilt.set(0);
      evaluate();
    }

    const root = document.documentElement;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    scheduleSleep();

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("mouseleave", onLeave);
      cancelFrame?.();
      if (sleepyTimer) clearTimeout(sleepyTimer);
      if (surpriseTimer) clearTimeout(surpriseTimer);
      evaluateRef.current = null;
      rawX.set(0);
      rawY.set(0);
      rawTilt.set(0);
      setExpression("neutral");
    };
  }, [enabled, target, rawX, rawY, rawTilt]);

  return { x, y, tilt, expression: enabled ? expression : "neutral" };
}
