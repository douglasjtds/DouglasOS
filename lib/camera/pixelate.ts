/**
 * Retro Cam pixelation pipeline (stage 9). Pure functions over RGBA buffers
 * (`Uint8ClampedArray`, 4 bytes per pixel, the `ImageData.data` layout), so
 * every step is unit-tested without a canvas:
 *
 *   capture frame ─ downscale (box average per block, optional mirror)
 *                 ─ quantize (nearest palette color, ordered dithering so a
 *                   16-color palette still reads as a face, not posterized blobs)
 *                 ─ upscale (nearest neighbor; on screen the browser does it
 *                   with `image-rendering: pixelated`, `upscale()` is for the
 *                   saved PNG)
 *
 * Nothing here touches the network: frames only ever live in memory.
 */
import type { Rgb } from "@/lib/camera/palettes";

export type PixelSize = "fine" | "medium" | "large";

export const PIXEL_SIZES: readonly PixelSize[] = ["fine", "medium", "large"];

export const DEFAULT_PIXEL_SIZE: PixelSize = "medium";

/**
 * Block edge in capture pixels for each size. At the 320px desktop capture
 * that's 160 / ~107 / ~53 blocks across: old-VGA-webcam chunky, still readable.
 */
export const BLOCK_SIZE: Record<PixelSize, number> = { fine: 2, medium: 3, large: 6 };

/** 4×4 Bayer matrix (values 0–15) for ordered dithering. */
const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * Dither amplitude (± half of this, in 0–255 channel units). Roughly the gap
 * between neighboring palette colors, so in-between tones become a fine
 * checker of the two nearest colors instead of snapping to one.
 */
export const DITHER_STRENGTH = 64;

/**
 * Width (px) the video frame is captured at before the block average. Phones
 * capture smaller for performance (the blocks stay the same size on screen,
 * there are just fewer of them).
 */
export const CAPTURE_WIDTH = { desktop: 320, mobile: 240 } as const;

/** Upper bound for the render loop (the spec's 15–24 FPS target). */
export const MAX_FPS = 24;

/** Width (px) of the saved photo before the optional frame. */
export const PHOTO_WIDTH = 640;

export function isPixelSize(value: string): value is PixelSize {
  return (PIXEL_SIZES as readonly string[]).includes(value);
}

/** Capture size that keeps the video's aspect ratio at `maxWidth`. */
export function captureSize(
  videoWidth: number,
  videoHeight: number,
  maxWidth: number,
): { width: number; height: number } {
  if (videoWidth <= 0 || videoHeight <= 0) return { width: maxWidth, height: Math.round((maxWidth * 3) / 4) };
  const width = Math.min(maxWidth, videoWidth);
  return { width, height: Math.max(1, Math.round((width * videoHeight) / videoWidth)) };
}

/** Number of blocks across and down for a capture size and block edge. */
export function gridSize(width: number, height: number, block: number): { cols: number; rows: number } {
  return {
    cols: Math.max(1, Math.round(width / block)),
    rows: Math.max(1, Math.round(height / block)),
  };
}

/**
 * Average each block of `src` (w × h) into one pixel of a cols × rows buffer.
 * Block edges are spread evenly, so sizes that aren't a multiple of the grid
 * still cover every source pixel. `mirror` flips horizontally (selfie view).
 */
export function downscale(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  cols: number,
  rows: number,
  mirror = false,
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(cols * rows * 4);
  for (let row = 0; row < rows; row++) {
    const y0 = Math.floor((row * h) / rows);
    const y1 = Math.max(y0 + 1, Math.floor(((row + 1) * h) / rows));
    for (let col = 0; col < cols; col++) {
      const x0 = Math.floor((col * w) / cols);
      const x1 = Math.max(x0 + 1, Math.floor(((col + 1) * w) / cols));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let y = y0; y < y1 && y < h; y++) {
        let i = (y * w + x0) * 4;
        for (let x = x0; x < x1 && x < w; x++, i += 4) {
          r += src[i];
          g += src[i + 1];
          b += src[i + 2];
          n++;
        }
      }
      const outCol = mirror ? cols - 1 - col : col;
      const o = (row * cols + outCol) * 4;
      out[o] = n ? r / n : 0;
      out[o + 1] = n ? g / n : 0;
      out[o + 2] = n ? b / n : 0;
      out[o + 3] = 255;
    }
  }
  return out;
}

/**
 * Perceptually weighted squared distance (green counts most, blue least), a
 * cheap stand-in for a proper color space that keeps faces from going blue.
 */
export function colorDistance(a: Rgb, r: number, g: number, b: number): number {
  const dr = a[0] - r;
  const dg = a[1] - g;
  const db = a[2] - b;
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
}

/** Index of the palette color closest to (r, g, b). */
export function nearestColorIndex(palette: readonly Rgb[], r: number, g: number, b: number): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const d = colorDistance(palette[i], r, g, b);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  return best;
}

/** Lookup tables per palette: 15-bit color (5 bits per channel) → palette index. */
const lutCache = new WeakMap<readonly Rgb[], Int16Array>();

function lutFor(palette: readonly Rgb[]): Int16Array {
  let lut = lutCache.get(palette);
  if (!lut) {
    lut = new Int16Array(1 << 15).fill(-1);
    lutCache.set(palette, lut);
  }
  return lut;
}

const clampByte = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * Snap every pixel of `pixels` (in place) to its nearest palette color and
 * return the same buffer. `null` (the "Original" palette) leaves it as is.
 * Colors are bucketed to 5 bits per channel and memoized per palette, so a
 * frame costs a table lookup per block after the first few frames.
 *
 * Pass `width` (the buffer's row length) to apply 4×4 ordered dithering
 * before the lookup; without it every pixel snaps straight to its nearest color.
 */
export function quantize<T extends Uint8ClampedArray>(
  pixels: T,
  palette: readonly Rgb[] | null,
  width?: number,
): T {
  if (!palette || palette.length === 0) return pixels;
  const lut = lutFor(palette);
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];
    if (width) {
      const p = i >> 2;
      const offset = ((BAYER_4[((Math.floor(p / width) & 3) << 2) | (p % width & 3)] + 0.5) / 16 - 0.5) * DITHER_STRENGTH;
      r = clampByte(r + offset);
      g = clampByte(g + offset);
      b = clampByte(b + offset);
    }
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let index = lut[key];
    if (index < 0) {
      // Compare the bucket's center so the cached answer holds for the whole bucket.
      index = nearestColorIndex(
        palette,
        ((r >> 3) << 3) | 4,
        ((g >> 3) << 3) | 4,
        ((b >> 3) << 3) | 4,
      );
      lut[key] = index;
    }
    const color = palette[index];
    pixels[i] = color[0];
    pixels[i + 1] = color[1];
    pixels[i + 2] = color[2];
  }
  return pixels;
}

/** Nearest-neighbor enlargement of a cols × rows buffer by an integer factor. */
export function upscale(
  pixels: Uint8ClampedArray,
  cols: number,
  rows: number,
  factor: number,
): Uint8ClampedArray<ArrayBuffer> {
  const f = Math.max(1, Math.floor(factor));
  const width = cols * f;
  const out = new Uint8ClampedArray(width * rows * f * 4);
  for (let y = 0; y < rows * f; y++) {
    const srcRow = Math.floor(y / f) * cols;
    for (let x = 0; x < width; x++) {
      const s = (srcRow + Math.floor(x / f)) * 4;
      const o = (y * width + x) * 4;
      out[o] = pixels[s];
      out[o + 1] = pixels[s + 1];
      out[o + 2] = pixels[s + 2];
      out[o + 3] = pixels[s + 3];
    }
  }
  return out;
}

export interface PhotoFrame {
  /** Outer band width (px) and color. */
  border: number;
  outer: Rgb;
  /** Inner mat width (px) and color, between the band and the picture. */
  mat: number;
  inner: Rgb;
}

/**
 * Surround a w × h picture with a two-band frame. Returns the new buffer and
 * its size; the picture itself is copied untouched into the middle.
 */
export function addFrame(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  frame: PhotoFrame,
): { pixels: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
  const pad = frame.border + frame.mat;
  const width = w + pad * 2;
  const height = h + pad * 2;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const edge = Math.min(x, y, width - 1 - x, height - 1 - y);
      if (edge >= pad) {
        const s = ((y - pad) * w + (x - pad)) * 4;
        out[o] = pixels[s];
        out[o + 1] = pixels[s + 1];
        out[o + 2] = pixels[s + 2];
        out[o + 3] = pixels[s + 3];
      } else {
        const color = edge < frame.border ? frame.outer : frame.inner;
        out[o] = color[0];
        out[o + 1] = color[1];
        out[o + 2] = color[2];
        out[o + 3] = 255;
      }
    }
  }
  return { pixels: out, width, height };
}

/** `douglasos-cam-YYYYMMDD-HHMMSS.png` in local time. */
export function photoFilename(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const day = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`;
  const time = `${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
  return `douglasos-cam-${day}-${time}.png`;
}

/**
 * Throttle for a requestAnimationFrame loop: lets through at most `maxFps`
 * frames per second, keeping the average on target on 60/120 Hz displays (a
 * 60 Hz screen alternates 2- and 3-frame gaps for 24 FPS).
 */
export function createFrameGate(maxFps: number) {
  const interval = 1000 / maxFps;
  let next = -Infinity;
  return {
    shouldRender(now: number): boolean {
      if (now + 1 < next) return false;
      next = now - next > interval ? now + interval : next + interval;
      return true;
    },
  };
}

/** Rolling frames-per-second over the last `windowMs` of rendered frames. */
export function createFpsMeter(windowMs = 1000) {
  const stamps: number[] = [];
  return {
    tick(now: number): number {
      stamps.push(now);
      while (stamps.length > 0 && stamps[0] < now - windowMs) stamps.shift();
      if (stamps.length < 2) return 0;
      return Math.round(((stamps.length - 1) * 1000) / (now - stamps[0]));
    },
    reset() {
      stamps.length = 0;
    },
  };
}
