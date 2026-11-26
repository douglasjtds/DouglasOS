import { describe, expect, it } from "vitest";
import { floodFill, type PixelBuffer, type Rgba } from "@/lib/paint/floodFill";

const WHITE: Rgba = [255, 255, 255, 255];
const BLACK: Rgba = [0, 0, 0, 255];
const RED: Rgba = [255, 0, 0, 255];

/** Build a buffer from rows of characters: "." white, "#" black, "r" red. */
function buffer(rows: string[]): PixelBuffer {
  const height = rows.length;
  const width = rows[0].length;
  const data = new Uint8ClampedArray(width * height * 4);
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const c = ch === "#" ? BLACK : ch === "r" ? RED : WHITE;
      data.set(c, (y * width + x) * 4);
    }),
  );
  return { data, width, height };
}

/** Back to characters, for readable assertions. */
function render(buf: PixelBuffer): string[] {
  const rows: string[] = [];
  for (let y = 0; y < buf.height; y++) {
    let row = "";
    for (let x = 0; x < buf.width; x++) {
      const o = (y * buf.width + x) * 4;
      const [r, g, b] = [buf.data[o], buf.data[o + 1], buf.data[o + 2]];
      row += r === 0 && g === 0 && b === 0 ? "#" : r === 255 && g === 0 && b === 0 ? "r" : ".";
    }
    rows.push(row);
  }
  return rows;
}

describe("floodFill", () => {
  it("fills an enclosed region and stops at the outline", () => {
    const buf = buffer([
      ".......",
      ".#####.",
      ".#...#.",
      ".#...#.",
      ".#####.",
      ".......",
    ]);
    const painted = floodFill(buf, 3, 2, RED);
    expect(painted).toBe(6);
    expect(render(buf)).toEqual([
      ".......",
      ".#####.",
      ".#rrr#.",
      ".#rrr#.",
      ".#####.",
      ".......",
    ]);
  });

  it("fills the outside around a shape", () => {
    const buf = buffer(["....", ".##.", "...."]);
    expect(floodFill(buf, 0, 0, RED)).toBe(10);
    expect(render(buf)).toEqual(["rrrr", "r##r", "rrrr"]);
  });

  it("is 4-connected: a diagonal gap doesn't leak", () => {
    const buf = buffer([
      ".#..",
      "#...",
      "....",
    ]);
    expect(floodFill(buf, 0, 0, RED)).toBe(1);
    expect(render(buf)[0]).toBe("r#..");
  });

  it("handles concave shapes that need re-seeding (U turns)", () => {
    const buf = buffer([
      "#.#.#",
      "#.#.#",
      "#...#",
      "#####",
    ]);
    expect(floodFill(buf, 1, 0, RED)).toBe(7);
    expect(render(buf)).toEqual(["#r#r#", "#r#r#", "#rrr#", "#####"]);
  });

  it("does nothing when the region already has the fill color", () => {
    const buf = buffer(["rr", "rr"]);
    expect(floodFill(buf, 0, 0, RED)).toBe(0);
  });

  it("ignores points outside the canvas and floors fractional ones", () => {
    const buf = buffer(["..", ".."]);
    expect(floodFill(buf, -1, 0, RED)).toBe(0);
    expect(floodFill(buf, 2, 0, RED)).toBe(0);
    expect(floodFill(buf, 0, 5, RED)).toBe(0);
    expect(floodFill(buf, 1.9, 1.9, RED)).toBe(4);
  });

  it("fills a big canvas without recursion overflow", () => {
    const width = 1024;
    const height = 768;
    const buf: PixelBuffer = { data: new Uint8ClampedArray(width * height * 4).fill(255), width, height };
    expect(floodFill(buf, 512, 384, BLACK)).toBe(width * height);
  });

  it("with tolerance, swallows near-colors (anti-aliased fringes) but not the outline", () => {
    const buf = buffer(["....", ".#..", "...."]);
    // An anti-aliased-looking light gray pixel next to the outline.
    buf.data.set([230, 230, 230, 255], (0 * 4 + 2) * 4);
    expect(floodFill(buf, 0, 0, RED, 48)).toBe(11);
    expect(render(buf)).toEqual(["rrrr", "r#rr", "rrrr"]);
  });

  it("terminates when the fill color is within tolerance of the target", () => {
    const buf = buffer(["...", "..."]);
    const nearWhite: Rgba = [250, 250, 250, 255];
    expect(floodFill(buf, 1, 1, nearWhite, 48)).toBe(6);
  });
});
