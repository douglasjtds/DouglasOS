import { describe, expect, it } from "vitest";
import {
  MAX_CANVAS,
  MIN_CANVAS,
  PAINT_PALETTE,
  PAINT_SIZES,
  PAINT_TOOLS,
  fitCanvasSize,
  hexToRgba,
  linePoints,
  paintFileName,
  rectFromPoints,
  strokeWidth,
  toCanvasPoint,
  usesSize,
} from "@/lib/paint/tools";

describe("paint palette", () => {
  it("has 28 distinct, valid colors including black and white", () => {
    expect(PAINT_PALETTE).toHaveLength(28);
    expect(new Set(PAINT_PALETTE.map((c) => c.toLowerCase())).size).toBe(28);
    for (const c of PAINT_PALETTE) expect(() => hexToRgba(c)).not.toThrow();
    expect(PAINT_PALETTE).toContain("#000000");
    expect(PAINT_PALETTE).toContain("#ffffff");
  });

  it("parses hex into opaque RGBA", () => {
    expect(hexToRgba("#316AC5")).toEqual([0x31, 0x6a, 0xc5, 255]);
    expect(() => hexToRgba("316ac5")).toThrow();
    expect(() => hexToRgba("#fff")).toThrow();
  });
});

describe("paint tools", () => {
  it("lists the six tools", () => {
    expect(PAINT_TOOLS).toEqual(["pencil", "brush", "eraser", "fill", "line", "rectangle"]);
  });

  it("only sized tools follow the size box", () => {
    expect(usesSize("pencil")).toBe(false);
    expect(usesSize("fill")).toBe(false);
    for (const t of ["brush", "eraser", "line", "rectangle"] as const) expect(usesSize(t)).toBe(true);
  });

  it("pencil is always 1px and the eraser is wider than the brush", () => {
    for (const size of PAINT_SIZES) {
      expect(strokeWidth("pencil", size)).toBe(1);
      expect(strokeWidth("brush", size)).toBe(size);
      expect(strokeWidth("eraser", size)).toBeGreaterThan(size);
    }
  });
});

describe("paint geometry", () => {
  it("fits the canvas to the available space within bounds", () => {
    expect(fitCanvasSize({ width: 600.4, height: 400.6 })).toEqual({ width: 600, height: 401 });
    expect(fitCanvasSize({ width: 5000, height: 5000 })).toEqual(MAX_CANVAS);
    expect(fitCanvasSize({ width: 10, height: 0 })).toEqual(MIN_CANVAS);
    expect(fitCanvasSize({ width: NaN, height: NaN })).toEqual(MIN_CANVAS);
  });

  it("maps client coordinates to canvas pixels, scaled and clamped", () => {
    const box = { left: 100, top: 50, width: 200, height: 100 };
    const canvas = { width: 400, height: 200 };
    expect(toCanvasPoint({ x: 100, y: 50 }, box, canvas)).toEqual({ x: 0, y: 0 });
    expect(toCanvasPoint({ x: 150, y: 75 }, box, canvas)).toEqual({ x: 100, y: 50 });
    expect(toCanvasPoint({ x: 1000, y: -20 }, box, canvas)).toEqual({ x: 399, y: 0 });
  });

  it("normalizes a rectangle dragged in any direction", () => {
    expect(rectFromPoints({ x: 10, y: 20 }, { x: 4, y: 2 })).toEqual({ x: 4, y: 2, width: 6, height: 18 });
  });

  it("rasterizes lines without gaps, endpoints included", () => {
    expect(linePoints({ x: 0, y: 0 }, { x: 0, y: 0 })).toEqual([{ x: 0, y: 0 }]);
    expect(linePoints({ x: 0, y: 0 }, { x: 3, y: 0 })).toHaveLength(4);
    const diag = linePoints({ x: 5, y: 5 }, { x: 0, y: 2 });
    expect(diag[0]).toEqual({ x: 5, y: 5 });
    expect(diag.at(-1)).toEqual({ x: 0, y: 2 });
    // Every step moves at most one pixel on each axis.
    for (let i = 1; i < diag.length; i++) {
      expect(Math.abs(diag[i].x - diag[i - 1].x)).toBeLessThanOrEqual(1);
      expect(Math.abs(diag[i].y - diag[i - 1].y)).toBeLessThanOrEqual(1);
    }
  });

  it("names saved files with a local timestamp", () => {
    expect(paintFileName(new Date(2026, 10, 5, 9, 3, 7))).toBe("douglasos-paint-20261105-090307.png");
  });
});
