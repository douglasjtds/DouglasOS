import type { Rgba } from "@/lib/paint/floodFill";

/**
 * DouglasOS Paint (stage 10): tools, palette, sizes and the small geometry
 * helpers the canvas needs. Pure, so the drawing rules are unit-tested.
 */

export const PAINT_TOOLS = ["pencil", "brush", "eraser", "fill", "line", "rectangle"] as const;
export type PaintTool = (typeof PAINT_TOOLS)[number];

/** Stroke widths offered in the size box (px). */
export const PAINT_SIZES = [1, 3, 5, 9] as const;
export type PaintSize = (typeof PAINT_SIZES)[number];

/** Tools whose stroke follows the size box (pencil is always 1px, fill has none). */
export function usesSize(tool: PaintTool): boolean {
  return tool === "brush" || tool === "eraser" || tool === "line" || tool === "rectangle";
}

/** Pixel width a tool actually strokes with: the eraser is wider, the pencil 1px. */
export function strokeWidth(tool: PaintTool, size: PaintSize): number {
  if (tool === "pencil") return 1;
  if (tool === "eraser") return size * 2 + 4;
  return size;
}

/**
 * The 28-color palette (two rows of 14 under the canvas). An original set,
 * not the classic program's: the first half comes from the Luna tokens in
 * `globals.css` and `ICON_COLORS`, the rest fills the hue wheel. Literal
 * values because the canvas needs them, not CSS variables. Dark shades on the
 * top row, their light partners right below.
 */
export const PAINT_PALETTE = [
  // Top row
  "#000000",
  "#5c5c5c",
  "#8d8977",
  "#0a246a",
  "#245ddb",
  "#2a6b6b",
  "#2e8b2e",
  "#6b8e23",
  "#c08a12",
  "#e5813a",
  "#d8461f",
  "#8f2a10",
  "#8a5424",
  "#4f3f78",
  // Bottom row
  "#ffffff",
  "#aca899",
  "#ece9d8",
  "#316ac5",
  "#5aa2ff",
  "#7fd1c7",
  "#7ed36f",
  "#d4e157",
  "#ffe58a",
  "#f8b330",
  "#f08a6c",
  "#e85d9a",
  "#c98a4b",
  "#a78bdb",
] as const;
export type PaintColor = (typeof PAINT_PALETTE)[number];

export const DEFAULT_TOOL: PaintTool = "pencil";
export const DEFAULT_COLOR: PaintColor = "#000000";
export const DEFAULT_SIZE: PaintSize = 3;
/** The page color: new canvases start white and the eraser paints white. */
export const CANVAS_BACKGROUND = "#ffffff";

/** Largest canvas Paint creates (bounds the undo snapshots' memory). */
export const MAX_CANVAS = { width: 1024, height: 768 } as const;
/** Smallest canvas, so a tiny window still gets something to draw on. */
export const MIN_CANVAS = { width: 160, height: 120 } as const;

/** `#rrggbb` → opaque RGBA tuple. */
export function hexToRgba(hex: string): Rgba {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`Invalid hex color: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, 255];
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Canvas size for the space available (the workspace's inner size), clamped
 * between `MIN_CANVAS` and `MAX_CANVAS`, in whole pixels.
 */
export function fitCanvasSize(available: { width: number; height: number }): {
  width: number;
  height: number;
} {
  const clamp = (v: number, min: number, max: number) =>
    Math.round(Math.min(max, Math.max(min, Number.isFinite(v) ? v : min)));
  return {
    width: clamp(available.width, MIN_CANVAS.width, MAX_CANVAS.width),
    height: clamp(available.height, MIN_CANVAS.height, MAX_CANVAS.height),
  };
}

/**
 * Pointer position (client px) → canvas pixel, accounting for the canvas
 * being displayed at a different size than its bitmap. Clamped inside the
 * canvas so a stroke dragged past the edge keeps drawing along it.
 */
export function toCanvasPoint(
  client: Point,
  box: { left: number; top: number; width: number; height: number },
  canvas: { width: number; height: number },
): Point {
  const sx = box.width > 0 ? canvas.width / box.width : 1;
  const sy = box.height > 0 ? canvas.height / box.height : 1;
  const x = Math.floor((client.x - box.left) * sx);
  const y = Math.floor((client.y - box.top) * sy);
  return {
    x: Math.min(canvas.width - 1, Math.max(0, x)),
    y: Math.min(canvas.height - 1, Math.max(0, y)),
  };
}

/** Rectangle spanned by two corner points, in either drag direction. */
export function rectFromPoints(a: Point, b: Point): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

/**
 * Integer points of the segment a → b (Bresenham), endpoints included. The
 * pencil plots these as single pixels, so it stays crisp and 1px wide with no
 * anti-aliasing, and fast drags leave no gaps.
 */
export function linePoints(a: Point, b: Point): Point[] {
  let x0 = Math.round(a.x);
  let y0 = Math.round(a.y);
  const x1 = Math.round(b.x);
  const y1 = Math.round(b.y);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const stepX = x0 < x1 ? 1 : -1;
  const stepY = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  const points: Point[] = [];
  for (;;) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) return points;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += stepX;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += stepY;
    }
  }
}

/** File name for "Save as PNG": `douglasos-paint-<yyyymmdd-hhmmss>.png` (local time). */
export function paintFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `douglasos-paint-${stamp}.png`;
}
