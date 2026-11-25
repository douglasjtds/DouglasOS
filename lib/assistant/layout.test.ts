import { describe, expect, it } from "vitest";
import {
  BUBBLE_SIZE,
  CHARACTER_SIZE,
  assistantClearance,
  bubbleRect,
  characterRect,
  intersects,
  tailOffset,
} from "@/lib/assistant/layout";
import { cellToPixel } from "@/lib/store/desktopGrid";
import { defaultBinCell, iconRect } from "@/lib/store/recycleBin";
import { defaultIconCells } from "@/lib/store/desktopStore";
import { TASKBAR_H, centerRect, maximizeRect, type Viewport } from "@/lib/store/geometry";

const VIEWPORTS: Viewport[] = [
  { width: 768, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

describe("characterRect", () => {
  for (const vp of VIEWPORTS) {
    it(`stands on the taskbar in the bottom-right corner, clear of the default icons and bin, at ${vp.width}×${vp.height}`, () => {
      const rect = characterRect(vp);
      expect(rect).toMatchObject(CHARACTER_SIZE);
      expect(rect.y + rect.height).toBe(vp.height - TASKBAR_H);
      expect(rect.x + rect.width).toBeLessThanOrEqual(vp.width);
      // Default icons fill the first two columns from the top-left...
      expect(rect.x).toBeGreaterThan(cellToPixel({ col: 1, row: 0 }, vp).x + 76);
      // ...and neither he nor his bubble covers the bin's top-right default.
      const bin = iconRect(defaultBinCell(vp), vp);
      expect(intersects(rect, bin)).toBe(false);
      expect(intersects(bubbleRect(vp), bin)).toBe(false);
      for (const cell of Object.values(defaultIconCells(vp))) {
        expect(intersects(bubbleRect(vp), iconRect(cell, vp))).toBe(false);
      }
    });
  }
});

describe("bubbleRect", () => {
  for (const vp of VIEWPORTS) {
    it(`sits above the character, inside the screen, at ${vp.width}×${vp.height}`, () => {
      const bubble = bubbleRect(vp);
      const character = characterRect(vp);
      expect(bubble.width).toBe(BUBBLE_SIZE.width);
      expect(bubble.y + bubble.height).toBeLessThan(character.y);
      expect(bubble.x).toBeGreaterThanOrEqual(0);
      expect(bubble.x + bubble.width).toBeLessThanOrEqual(vp.width);
      expect(bubble.y).toBeGreaterThanOrEqual(0);
      const tail = tailOffset(vp);
      expect(tail).toBeGreaterThanOrEqual(16);
      expect(tail).toBeLessThanOrEqual(bubble.width - 16);
    });
  }
});

describe("assistantClearance", () => {
  const vp = { width: 1440, height: 900 };

  it("is clear with no focused window, a centered one or a maximized one", () => {
    expect(assistantClearance(vp, null)).toEqual({ character: true, bubble: true });
    expect(assistantClearance(vp, centerRect({ width: 700, height: 600 }, vp))).toEqual({
      character: true,
      bubble: true,
    });
    expect(assistantClearance(vp, maximizeRect(vp))).toEqual({ character: true, bubble: true });
  });

  it("holds the bubble when the focused title bar runs under it", () => {
    const bubble = bubbleRect(vp);
    const window = { x: bubble.x - 100, y: bubble.y + 20, width: 400, height: 300 };
    expect(assistantClearance(vp, window)).toEqual({ character: true, bubble: false });
  });

  it("hides the character when the focused title bar would sit under him", () => {
    const character = characterRect(vp);
    const window = { x: character.x - 200, y: character.y + 10, width: 400, height: 300 };
    expect(assistantClearance(vp, window)).toEqual({ character: false, bubble: false });
  });
});
