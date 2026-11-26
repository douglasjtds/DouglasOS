import { describe, expect, it } from "vitest";
import {
  CASCADE,
  CASCADE_WRAP,
  MIN_HEIGHT,
  MIN_WIDTH,
  centerRect,
  clampPosition,
  clampRect,
  clampSize,
  initialRect,
  maximizeRect,
  resizeRect,
  TASKBAR_H,
  TITLEBAR_H,
  workAreaHeight,
  type Rect,
  type Viewport,
} from "@/lib/store/geometry";

const VP: Viewport = { width: 1440, height: 900 };

describe("centerRect", () => {
  it("centers a window horizontally in the viewport", () => {
    const size = { width: 600, height: 400 };
    const rect = centerRect(size, VP);
    expect(rect.x).toBe(Math.round((VP.width - size.width) / 2));
    expect(rect.width).toBe(size.width);
    expect(rect.height).toBe(size.height);
  });

  it("centers vertically in the work area above the taskbar", () => {
    const rect = centerRect({ width: 400, height: 300 }, VP);
    expect(rect.y).toBe(Math.round((VP.height - TASKBAR_H - 300) / 2));
    expect(rect.y + rect.height).toBeLessThanOrEqual(VP.height - TASKBAR_H);
  });
});

describe("initialRect", () => {
  it("matches centerRect on the first open (index 0)", () => {
    const size = { width: 500, height: 360 };
    expect(initialRect(size, 0, VP)).toEqual(centerRect(size, VP));
  });

  it("cascades by CASCADE px per open before wrapping", () => {
    const size = { width: 500, height: 360 };
    const base = centerRect(size, VP);
    const second = initialRect(size, 1, VP);
    expect(second.x).toBe(base.x + CASCADE);
    expect(second.y).toBe(base.y + CASCADE);
  });

  it("wraps back to center every CASCADE_WRAP opens", () => {
    const size = { width: 500, height: 360 };
    const first = initialRect(size, 0, VP);
    const wrapped = initialRect(size, CASCADE_WRAP, VP);
    expect(wrapped).toEqual(first);
  });
});

describe("workAreaHeight", () => {
  it("is the viewport height minus the taskbar", () => {
    expect(workAreaHeight(VP)).toBe(VP.height - TASKBAR_H);
  });
});

describe("maximizeRect", () => {
  it("fills the whole work area: full width, top edge down to the taskbar", () => {
    expect(maximizeRect(VP)).toEqual({
      x: 0,
      y: 0,
      width: VP.width,
      height: VP.height - TASKBAR_H,
    });
  });
});

describe("clampPosition", () => {
  const size = { width: 400, height: 300 };

  it("never lets the title bar go above the top edge", () => {
    const { y } = clampPosition(0, -500, size, VP);
    expect(y).toBe(0);
  });

  it("never lets the title bar slide behind the taskbar", () => {
    const { y } = clampPosition(0, 99999, size, VP);
    expect(y).toBe(VP.height - TASKBAR_H - TITLEBAR_H);
  });

  it("keeps a grabbable margin when dragged off the right edge", () => {
    const { x } = clampPosition(99999, 200, size, VP);
    expect(x).toBeLessThanOrEqual(VP.width);
    // The whole window can't slide off; a strip stays on-screen.
    expect(x).toBeLessThan(VP.width);
  });

  it("keeps a grabbable margin when dragged off the left edge", () => {
    const { x } = clampPosition(-99999, 200, size, VP);
    // Part of the window remains within the viewport.
    expect(x + size.width).toBeGreaterThan(0);
  });

  it("falls back to the min when the viewport is too short for the margins", () => {
    // Height < taskbar + title bar makes maxY drop below minY, so clamp returns min.
    const tiny: Viewport = { width: 100, height: 50 };
    const { y } = clampPosition(0, 500, size, tiny);
    expect(y).toBe(0);
  });
});

describe("clampRect", () => {
  it("clamps position without changing size", () => {
    const rect = { x: 99999, y: -500, width: 400, height: 300 };
    const clamped = clampRect(rect, VP);
    expect(clamped.width).toBe(rect.width);
    expect(clamped.height).toBe(rect.height);
    expect(clamped.y).toBe(0);
  });
});

describe("resizeRect", () => {
  // A comfortably-placed window with room to grow/shrink in every direction.
  const origin: Rect = { x: 100, y: 100, width: 600, height: 400 };
  const right = origin.x + origin.width; // 700
  const bottom = origin.y + origin.height; // 500

  it("grows width from the east edge, anchoring the left edge", () => {
    const r = resizeRect(origin, "e", 50, 0, VP);
    expect(r).toEqual({ x: 100, y: 100, width: 650, height: 400 });
  });

  it("moves x and shrinks width from the west edge, anchoring the right edge", () => {
    const r = resizeRect(origin, "w", 40, 0, VP);
    expect(r.x).toBe(140);
    expect(r.width).toBe(560);
    expect(r.x + r.width).toBe(right); // right edge stays put
    expect(r.height).toBe(400);
  });

  it("grows height from the south edge, anchoring the top", () => {
    const r = resizeRect(origin, "s", 0, 30, VP);
    expect(r).toEqual({ x: 100, y: 100, width: 600, height: 430 });
  });

  it("moves y and shrinks height from the north edge, anchoring the bottom", () => {
    const r = resizeRect(origin, "n", 0, 30, VP);
    expect(r.y).toBe(130);
    expect(r.height).toBe(370);
    expect(r.y + r.height).toBe(bottom); // bottom edge stays put
  });

  it("resizes both dimensions from a corner (se)", () => {
    const r = resizeRect(origin, "se", 50, 30, VP);
    expect(r).toEqual({ x: 100, y: 100, width: 650, height: 430 });
  });

  it("clamps to MIN_WIDTH from the west edge, anchoring the right edge", () => {
    const r = resizeRect(origin, "w", 9999, 0, VP);
    expect(r.width).toBe(MIN_WIDTH);
    expect(r.x + r.width).toBe(right);
  });

  it("clamps to MIN_HEIGHT from the north edge, anchoring the bottom", () => {
    const r = resizeRect(origin, "n", 0, 9999, VP);
    expect(r.height).toBe(MIN_HEIGHT);
    expect(r.y + r.height).toBe(bottom);
  });

  it("never lets the north edge rise above the top edge", () => {
    const r = resizeRect(origin, "n", 0, -9999, VP);
    expect(r.y).toBe(0);
    expect(r.y + r.height).toBe(bottom);
  });

  it("keeps the east edge within the viewport width", () => {
    const r = resizeRect(origin, "e", 9999, 0, VP);
    expect(r.x + r.width).toBeLessThanOrEqual(VP.width);
  });

  it("keeps the south edge above the taskbar", () => {
    const r = resizeRect(origin, "s", 0, 9999, VP);
    expect(r.y + r.height).toBe(VP.height - TASKBAR_H);
  });
});

describe("clampSize", () => {
  it("clamps an oversized rect to fit the viewport", () => {
    const r = clampSize({ x: 0, y: 0, width: 5000, height: 5000 }, VP);
    expect(r.width).toBeLessThanOrEqual(VP.width);
    expect(r.height).toBeLessThanOrEqual(VP.height - TASKBAR_H);
  });

  it("leaves a comfortably-sized rect unchanged", () => {
    const rect: Rect = { x: 100, y: 100, width: 600, height: 400 };
    expect(clampSize(rect, VP)).toEqual(rect);
  });

  it("never shrinks below the minimum window size", () => {
    const r = clampSize({ x: 0, y: 0, width: 50, height: 50 }, VP);
    expect(r.width).toBe(MIN_WIDTH);
    expect(r.height).toBe(MIN_HEIGHT);
  });
});
