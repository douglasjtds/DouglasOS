import { describe, expect, it } from "vitest";
import { VISUALIZER_FRAME_MS, barLevels, shouldDraw } from "@/lib/media/visualizer";

describe("visualizer", () => {
  it("is deterministic and bounded", () => {
    expect(barLevels(1234, 16)).toEqual(barLevels(1234, 16));
    for (const t of [0, 500, 99_999]) {
      for (const level of barLevels(t, 24)) {
        expect(level).toBeGreaterThanOrEqual(0.05);
        expect(level).toBeLessThanOrEqual(1);
      }
    }
    expect(barLevels(0, 24)).not.toEqual(barLevels(400, 24));
  });

  it("throttles to ~30fps", () => {
    expect(VISUALIZER_FRAME_MS).toBeCloseTo(33.3, 0);
    expect(shouldDraw(100, 90)).toBe(false);
    expect(shouldDraw(140, 100)).toBe(true);
  });
});
