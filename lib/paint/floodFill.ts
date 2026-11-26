/**
 * Paint-bucket flood fill for DouglasOS Paint (stage 10). Pure: works on a
 * raw RGBA buffer (the `data` of a canvas `ImageData`), so it's testable
 * without a canvas.
 */

/** An RGBA pixel buffer, row-major, 4 bytes per pixel (canvas `ImageData`). */
export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export type Rgba = readonly [r: number, g: number, b: number, a: number];

/**
 * Tolerance Paint uses for the bucket: the brush and shapes are
 * anti-aliased, so an exact match would leave a ring of half-tinted pixels
 * around every stroke. Per channel, 0–255.
 */
export const PAINT_FILL_TOLERANCE = 48;

/**
 * Fill the 4-connected region around (`x`, `y`) whose pixels match the start
 * pixel's color (each channel within `tolerance`) with `fill`, in place.
 * Scanline algorithm with an explicit stack (no recursion, so a full-canvas
 * fill can't overflow) and a visited mask (so a fill color that itself
 * matches the target can't loop).
 *
 * Returns the number of pixels painted: 0 when the point is outside the
 * buffer or the region already has the fill color.
 */
export function floodFill(
  buffer: PixelBuffer,
  x: number,
  y: number,
  fill: Rgba,
  tolerance = 0,
): number {
  const { data, width, height } = buffer;
  const sx = Math.floor(x);
  const sy = Math.floor(y);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return 0;

  const start = (sy * width + sx) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]] as const;
  if (target.every((v, i) => v === fill[i])) return 0;

  const matches = (p: number) => {
    const o = p * 4;
    return (
      Math.abs(data[o] - target[0]) <= tolerance &&
      Math.abs(data[o + 1] - target[1]) <= tolerance &&
      Math.abs(data[o + 2] - target[2]) <= tolerance &&
      Math.abs(data[o + 3] - target[3]) <= tolerance
    );
  };
  const visited = new Uint8Array(width * height);
  const paint = (p: number) => {
    const o = p * 4;
    data[o] = fill[0];
    data[o + 1] = fill[1];
    data[o + 2] = fill[2];
    data[o + 3] = fill[3];
    visited[p] = 1;
  };
  const open = (p: number) => visited[p] === 0 && matches(p);

  let painted = 0;
  const stack: number[] = [sx, sy];
  while (stack.length > 0) {
    const cy = stack.pop()!;
    const cx = stack.pop()!;
    const row = cy * width;
    if (!open(row + cx)) continue;

    // Grow the span left and right from the seed.
    let left = cx;
    while (left > 0 && open(row + left - 1)) left--;
    let right = cx;
    while (right < width - 1 && open(row + right + 1)) right++;

    for (let i = left; i <= right; i++) paint(row + i);
    painted += right - left + 1;

    // Seed the rows above and below: one seed per run of open pixels.
    for (const ny of [cy - 1, cy + 1]) {
      if (ny < 0 || ny >= height) continue;
      const nrow = ny * width;
      let inRun = false;
      for (let i = left; i <= right; i++) {
        if (open(nrow + i)) {
          if (!inRun) {
            stack.push(i, ny);
            inRun = true;
          }
        } else {
          inRun = false;
        }
      }
    }
  }
  return painted;
}
