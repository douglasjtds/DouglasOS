import { describe, expect, it } from "vitest";
import {
  GAZE_TUNING,
  distanceToRect,
  gazeOffset,
  headTilt,
  pickExpression,
  pointInRect,
  rectCenter,
  shouldStartle,
  type ExpressionInput,
} from "@/lib/assistant/gaze";

const RECT = { x: 100, y: 200, width: 96, height: 112 };

describe("rect helpers", () => {
  it("finds the center", () => {
    expect(rectCenter(RECT)).toEqual({ x: 148, y: 256 });
  });

  it("tells inside from outside, edges included", () => {
    expect(pointInRect(RECT, { x: 100, y: 200 })).toBe(true);
    expect(pointInRect(RECT, { x: 196, y: 312 })).toBe(true);
    expect(pointInRect(RECT, { x: 197, y: 250 })).toBe(false);
  });

  it("measures the distance to the nearest edge", () => {
    expect(distanceToRect(RECT, { x: 150, y: 250 })).toBe(0);
    expect(distanceToRect(RECT, { x: 50, y: 250 })).toBe(50);
    expect(distanceToRect(RECT, { x: 150, y: 412 })).toBe(100);
    expect(distanceToRect(RECT, { x: 196 + 30, y: 200 - 40 })).toBe(50);
  });
});

describe("gazeOffset", () => {
  const center = { x: 0, y: 0 };

  it("looks straight ahead when the pointer is on his center", () => {
    expect(gazeOffset(center, center)).toEqual({ x: 0, y: 0 });
  });

  it("reaches the full offset at gazeFullAt and never beyond", () => {
    expect(gazeOffset(center, { x: GAZE_TUNING.gazeFullAt, y: 0 })).toEqual({ x: 1, y: 0 });
    expect(gazeOffset(center, { x: -5000, y: 0 })).toEqual({ x: -1, y: 0 });
    const far = gazeOffset(center, { x: 3000, y: -4000 });
    expect(Math.hypot(far.x, far.y)).toBeCloseTo(1);
    expect(far.x).toBeCloseTo(0.6);
    expect(far.y).toBeCloseTo(-0.8);
  });

  it("scales down for a pointer close to his face", () => {
    const near = gazeOffset(center, { x: 0, y: GAZE_TUNING.gazeFullAt / 4 });
    expect(near.x).toBeCloseTo(0);
    expect(near.y).toBeCloseTo(0.25);
  });
});

describe("headTilt", () => {
  it("tilts toward the pointer, clamped to maxTilt", () => {
    const center = { x: 500, y: 500 };
    expect(headTilt(center, { x: 500, y: 0 })).toBe(0);
    expect(headTilt(center, { x: 500 + GAZE_TUNING.tiltFullAt / 2, y: 500 })).toBeCloseTo(GAZE_TUNING.maxTilt / 2);
    expect(headTilt(center, { x: -9999, y: 500 })).toBe(-GAZE_TUNING.maxTilt);
  });
});

describe("pickExpression", () => {
  const base: ExpressionInput = { state: "idle", hovering: false, distance: Infinity, surprised: false, idleMs: 0 };

  it("is neutral by default", () => {
    expect(pickExpression(base)).toBe("neutral");
  });

  it("is happy while hovered, above everything else", () => {
    expect(pickExpression({ ...base, hovering: true, surprised: true, distance: 0, idleMs: 99_999 })).toBe("happy");
  });

  it("is surprised during a surprise", () => {
    expect(pickExpression({ ...base, surprised: true, distance: 10 })).toBe("surprised");
  });

  it("is curious when the cursor is near", () => {
    expect(pickExpression({ ...base, distance: GAZE_TUNING.curiousRadius - 1 })).toBe("curious");
    expect(pickExpression({ ...base, distance: GAZE_TUNING.curiousRadius })).toBe("neutral");
  });

  it("dozes off after sleepyMs without input", () => {
    expect(pickExpression({ ...base, idleMs: GAZE_TUNING.sleepyMs - 1 })).toBe("neutral");
    expect(pickExpression({ ...base, idleMs: GAZE_TUNING.sleepyMs })).toBe("sleepy");
  });

  it("dozes off even with the cursor parked nearby", () => {
    expect(pickExpression({ ...base, distance: 10, idleMs: GAZE_TUNING.sleepyMs })).toBe("sleepy");
  });

  it("while talking only lights up or gets startled", () => {
    const talking = { ...base, state: "talking" as const };
    expect(pickExpression({ ...talking, hovering: true })).toBe("happy");
    expect(pickExpression({ ...talking, surprised: true })).toBe("surprised");
    expect(pickExpression({ ...talking, distance: 0 })).toBe("neutral");
    expect(pickExpression({ ...talking, idleMs: 99_999 })).toBe("neutral");
  });

  it("keeps his dance face while dancing", () => {
    expect(pickExpression({ ...base, state: "dancing", hovering: true, surprised: true })).toBe("neutral");
  });
});

describe("shouldStartle", () => {
  const ready = GAZE_TUNING.surprisedMs + GAZE_TUNING.surprisedCooldownMs;

  it("startles on a fast pass nearby", () => {
    expect(shouldStartle(GAZE_TUNING.surprisedSpeed, 0, ready)).toBe(true);
  });

  it("ignores slow, distant or too-frequent passes", () => {
    expect(shouldStartle(GAZE_TUNING.surprisedSpeed - 0.1, 0, ready)).toBe(false);
    expect(shouldStartle(10, GAZE_TUNING.surprisedRadius, ready)).toBe(false);
    expect(shouldStartle(10, 0, ready - 1)).toBe(false);
  });
});
