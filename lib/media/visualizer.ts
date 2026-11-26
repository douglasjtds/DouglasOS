/**
 * Decorative, deterministic visualizer levels. The audio plays inside
 * YouTube's cross-origin iframe, so there is no access to the samples (no
 * Web Audio AnalyserNode); the bars are a pure function of time instead —
 * same input, same frame, which keeps it testable.
 */

/** Target frame interval (~30fps). */
export const VISUALIZER_FRAME_MS = 1000 / 30;

/** Level (0..1) of every bar at time `t` (ms). */
export function barLevels(t: number, count: number): number[] {
  const levels: number[] = [];
  const s = t / 1000;
  for (let i = 0; i < count; i++) {
    const phase = i * 0.7;
    const wave =
      0.5 * Math.sin(s * 5.1 + phase) +
      0.3 * Math.sin(s * 8.3 + phase * 1.9) +
      0.2 * Math.sin(s * 2.3 + phase * 0.4);
    // Lower bars (bass) a bit taller, like a real spectrum.
    const tilt = 1 - (i / Math.max(1, count - 1)) * 0.35;
    const level = (0.15 + 0.85 * ((wave + 1) / 2)) * tilt;
    levels.push(Math.max(0.05, Math.min(1, level)));
  }
  return levels;
}

/** Whether a frame should be drawn now (throttles rAF to ~30fps). */
export function shouldDraw(now: number, last: number, frameMs: number = VISUALIZER_FRAME_MS): boolean {
  return now - last >= frameMs - 1;
}
