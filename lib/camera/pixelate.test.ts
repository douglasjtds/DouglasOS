import { describe, expect, it } from "vitest";
import { PALETTES, type Rgb } from "@/lib/camera/palettes";
import {
  BLOCK_SIZE,
  addFrame,
  captureSize,
  createFpsMeter,
  createFrameGate,
  downscale,
  gridSize,
  isPixelSize,
  nearestColorIndex,
  photoFilename,
  quantize,
  upscale,
} from "@/lib/camera/pixelate";

/** Build a w × h RGBA buffer from a color function. */
function image(w: number, h: number, color: (x: number, y: number) => Rgb): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = color(x, y);
      out.set([r, g, b, 255], (y * w + x) * 4);
    }
  }
  return out;
}

function pixel(buffer: Uint8ClampedArray, w: number, x: number, y: number): number[] {
  const i = (y * w + x) * 4;
  return Array.from(buffer.slice(i, i + 4));
}

describe("captureSize / gridSize", () => {
  it("keeps the aspect ratio and never upsizes the video", () => {
    expect(captureSize(640, 480, 320)).toEqual({ width: 320, height: 240 });
    expect(captureSize(1280, 720, 320)).toEqual({ width: 320, height: 180 });
    expect(captureSize(200, 150, 320)).toEqual({ width: 200, height: 150 });
    expect(captureSize(0, 0, 240)).toEqual({ width: 240, height: 180 });
  });

  it("blocks get bigger from Fine to Large", () => {
    expect(BLOCK_SIZE.fine).toBeLessThan(BLOCK_SIZE.medium);
    expect(BLOCK_SIZE.medium).toBeLessThan(BLOCK_SIZE.large);
    expect(gridSize(320, 240, BLOCK_SIZE.fine)).toEqual({ cols: 160, rows: 120 });
    expect(gridSize(320, 240, BLOCK_SIZE.medium)).toEqual({ cols: 107, rows: 80 });
    expect(gridSize(3, 3, 16)).toEqual({ cols: 1, rows: 1 });
    expect(isPixelSize("large")).toBe(true);
    expect(isPixelSize("huge")).toBe(false);
  });
});

describe("downscale", () => {
  it("averages each block", () => {
    // 4×2 image: left half black/white checker, right half solid red.
    const src = image(4, 2, (x, y) => (x < 2 ? ((x + y) % 2 ? [255, 255, 255] : [0, 0, 0]) : [200, 0, 0]));
    const out = downscale(src, 4, 2, 2, 1);
    expect(out).toHaveLength(2 * 4);
    expect(pixel(out, 2, 0, 0)).toEqual([128, 128, 128, 255]); // 127.5 rounds up when clamped
    expect(pixel(out, 2, 1, 0)).toEqual([200, 0, 0, 255]);
  });

  it("mirrors horizontally for the selfie view", () => {
    const src = image(4, 1, (x) => (x < 2 ? [0, 0, 255] : [0, 255, 0]));
    const plain = downscale(src, 4, 1, 2, 1, false);
    const mirrored = downscale(src, 4, 1, 2, 1, true);
    expect(pixel(plain, 2, 0, 0)).toEqual([0, 0, 255, 255]);
    expect(pixel(mirrored, 2, 0, 0)).toEqual([0, 255, 0, 255]);
    expect(pixel(mirrored, 2, 1, 0)).toEqual([0, 0, 255, 255]);
  });

  it("covers sizes that aren't a multiple of the grid", () => {
    const src = image(10, 7, () => [10, 20, 30]);
    const out = downscale(src, 10, 7, 3, 2);
    for (let i = 0; i < 6; i++) expect(pixel(out, 3, i % 3, Math.floor(i / 3))).toEqual([10, 20, 30, 255]);
  });
});

describe("quantize", () => {
  it("snaps to the nearest palette color", () => {
    const palette: Rgb[] = [
      [0, 0, 0],
      [255, 255, 255],
      [255, 0, 0],
    ];
    expect(nearestColorIndex(palette, 20, 10, 10)).toBe(0);
    expect(nearestColorIndex(palette, 240, 230, 235)).toBe(1);
    expect(nearestColorIndex(palette, 200, 40, 30)).toBe(2);
    const pixels = new Uint8ClampedArray([20, 10, 10, 255, 240, 230, 235, 255, 200, 40, 30, 255]);
    quantize(pixels, palette);
    expect(Array.from(pixels)).toEqual([0, 0, 0, 255, 255, 255, 255, 255, 255, 0, 0, 255]);
  });

  it("only ever outputs palette colors (CGA)", () => {
    const pixels = image(16, 16, (x, y) => [x * 16, y * 16, (x * y) % 256]);
    quantize(pixels, PALETTES.cga);
    const allowed = new Set(PALETTES.cga!.map((c) => c.join(",")));
    for (let i = 0; i < pixels.length; i += 4) {
      expect(allowed.has(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`)).toBe(true);
      expect(pixels[i + 3]).toBe(255);
    }
  });

  it("is consistent across frames (memoized buckets)", () => {
    const a = new Uint8ClampedArray([100, 150, 200, 255]);
    const b = new Uint8ClampedArray([101, 151, 201, 255]);
    quantize(a, PALETTES.classic16);
    quantize(b, PALETTES.classic16);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it("ordered dithering mixes the two nearest colors for in-between tones", () => {
    const palette: Rgb[] = [
      [0, 0, 0],
      [128, 128, 128],
      [255, 255, 255],
    ];
    const flat = image(4, 4, () => [64, 64, 64]);
    const dithered = image(4, 4, () => [64, 64, 64]);
    quantize(flat, palette);
    quantize(dithered, palette, 4);
    const grays = (buf: Uint8ClampedArray) => {
      const out: number[] = [];
      for (let i = 0; i < buf.length; i += 4) out.push(buf[i]);
      return out;
    };
    expect(new Set(grays(flat)).size).toBe(1);
    const mixed = grays(dithered);
    expect(mixed.filter((v) => v === 0)).toHaveLength(8);
    expect(mixed.filter((v) => v === 128)).toHaveLength(8);
  });

  it("Original leaves the colors alone", () => {
    const pixels = new Uint8ClampedArray([1, 2, 3, 255]);
    expect(Array.from(quantize(pixels, PALETTES.original))).toEqual([1, 2, 3, 255]);
  });
});

describe("upscale / addFrame", () => {
  it("enlarges with nearest neighbor (hard pixel edges)", () => {
    const src = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]); // 2×1: red, blue
    const out = upscale(src, 2, 1, 3);
    expect(out).toHaveLength(6 * 3 * 4);
    expect(pixel(out, 6, 2, 2)).toEqual([255, 0, 0, 255]);
    expect(pixel(out, 6, 3, 0)).toEqual([0, 0, 255, 255]);
  });

  it("frames the picture with the band and the mat", () => {
    const src = image(2, 2, () => [9, 9, 9]);
    const { pixels, width, height } = addFrame(src, 2, 2, {
      border: 2,
      outer: [0, 88, 238],
      mat: 1,
      inner: [236, 233, 216],
    });
    expect([width, height]).toEqual([8, 8]);
    expect(pixel(pixels, 8, 0, 0)).toEqual([0, 88, 238, 255]);
    expect(pixel(pixels, 8, 2, 4)).toEqual([236, 233, 216, 255]);
    expect(pixel(pixels, 8, 3, 3)).toEqual([9, 9, 9, 255]);
    expect(pixel(pixels, 8, 4, 4)).toEqual([9, 9, 9, 255]);
  });
});

describe("photoFilename", () => {
  it("is douglasos-cam-<timestamp>.png in local time", () => {
    expect(photoFilename(new Date(2026, 10, 5, 9, 3, 7))).toBe("douglasos-cam-20261105-090307.png");
  });
});

describe("createFrameGate", () => {
  it("averages 24 FPS on a 60 Hz display", () => {
    const gate = createFrameGate(24);
    let rendered = 0;
    for (let frame = 0; frame < 600; frame++) if (gate.shouldRender((frame * 1000) / 60)) rendered++;
    // 10 seconds of 60 Hz frames.
    expect(rendered).toBeGreaterThanOrEqual(238);
    expect(rendered).toBeLessThanOrEqual(242);
  });

  it("never exceeds the cap on 120 Hz and recovers after a stall", () => {
    const gate = createFrameGate(24);
    let rendered = 0;
    for (let frame = 0; frame < 120; frame++) if (gate.shouldRender((frame * 1000) / 120)) rendered++;
    expect(rendered).toBeLessThanOrEqual(25);
    expect(gate.shouldRender(5000)).toBe(true);
    expect(gate.shouldRender(5010)).toBe(false);
  });
});

describe("createFpsMeter", () => {
  it("reports frames per second over the last second", () => {
    const meter = createFpsMeter();
    let fps = 0;
    for (let i = 0; i <= 48; i++) fps = meter.tick(i * 50); // 20 FPS for 2.4 s
    expect(fps).toBe(20);
    meter.reset();
    expect(meter.tick(10_000)).toBe(0);
  });
});
