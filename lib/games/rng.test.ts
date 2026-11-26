import { describe, expect, it } from "vitest";
import { createRng, randomInt, shuffle } from "@/lib/games/rng";

describe("rng", () => {
  it("is deterministic for a seed and stays in [0, 1)", () => {
    const a = createRng(42);
    const b = createRng(42);
    const values = Array.from({ length: 50 }, () => a());
    expect(values).toEqual(Array.from({ length: 50 }, () => b()));
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(createRng(43)()).not.toBe(createRng(42)());
  });

  it("randomInt stays within bounds", () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) {
      const n = randomInt(rng, 7);
      expect(Number.isInteger(n) && n >= 0 && n < 7).toBe(true);
    }
  });

  it("shuffle is a deterministic permutation and leaves the input alone", () => {
    const input = Array.from({ length: 20 }, (_, i) => i);
    const out = shuffle(input, createRng(7));
    expect(out).toEqual(shuffle(input, createRng(7)));
    expect([...out].sort((x, y) => x - y)).toEqual(input);
    expect(out).not.toEqual(input);
    expect(input[0]).toBe(0);
  });
});
