import { describe, expect, it } from "vitest";
import {
  EASTER_EGGS,
  EASTER_EGG_STORAGE_KEY,
  EGG_TIMING,
  SCRAMBLE_SETTLED_AT,
  eggForOpen,
  parseOpenCount,
  scatterOffsets,
  takeNextEgg,
} from "@/lib/easterEgg";

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    map,
  };
}

describe("easter egg cycle", () => {
  it("cycles A → B → C and repeats", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(eggForOpen)).toEqual([
      "not-found",
      "scramble",
      "access-denied",
      "not-found",
      "scramble",
      "access-denied",
      "not-found",
    ]);
    expect(EASTER_EGGS).toHaveLength(3);
  });

  it("treats nonsense counts as the first open", () => {
    expect(eggForOpen(-3)).toBe("not-found");
    expect(eggForOpen(NaN)).toBe("not-found");
    expect(parseOpenCount(null)).toBe(0);
    expect(parseOpenCount("abc")).toBe(0);
    expect(parseOpenCount("-1")).toBe(0);
    expect(parseOpenCount("1.5")).toBe(0);
    expect(parseOpenCount("4")).toBe(4);
  });

  it("takes the next egg from sessionStorage and advances the count", () => {
    const storage = memoryStorage();
    expect(takeNextEgg(storage)).toBe("not-found");
    expect(takeNextEgg(storage)).toBe("scramble");
    expect(takeNextEgg(storage)).toBe("access-denied");
    expect(takeNextEgg(storage)).toBe("not-found");
    expect(storage.map.get(EASTER_EGG_STORAGE_KEY)).toBe("4");
  });

  it("never throws without storage or with blocked storage", () => {
    expect(takeNextEgg(null)).toBe("not-found");
    const blocked = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(takeNextEgg(blocked)).toBe("not-found");
  });
});

describe("easter egg timing", () => {
  it("every animated part ends before 5 seconds", () => {
    const n = EGG_TIMING.notFound;
    expect(Math.max(n.progressEnd, n.recovery)).toBeLessThan(5);
    expect(SCRAMBLE_SETTLED_AT + EGG_TIMING.scramble.pulse).toBeLessThan(5);
    const a = EGG_TIMING.accessDenied;
    expect(Math.max(a.noteDelay + a.noteDuration, a.scold)).toBeLessThan(5);
  });
});

describe("scatterOffsets", () => {
  const area = { width: 1000, height: 600 };
  const boxes = [
    { left: 10, top: 10, width: 76, height: 80 },
    { left: 900, top: 500, width: 76, height: 80 },
  ];

  it("keeps every icon fully inside the area", () => {
    for (const seed of [0, 0.25, 0.5, 0.999]) {
      const offsets = scatterOffsets(boxes, area, () => seed);
      offsets.forEach((o, i) => {
        const left = boxes[i].left + o.x;
        const top = boxes[i].top + o.y;
        expect(left).toBeGreaterThanOrEqual(-1);
        expect(top).toBeGreaterThanOrEqual(-1);
        expect(left + boxes[i].width).toBeLessThanOrEqual(area.width + 1);
        expect(top + boxes[i].height).toBeLessThanOrEqual(area.height + 1);
        expect(Math.abs(o.rotate)).toBeLessThanOrEqual(25);
      });
    }
  });

  it("is deterministic for a given random source", () => {
    const values = [0.1, 0.9, 0.5, 0.3, 0.7, 0.2];
    const seq = () => {
      let i = 0;
      return () => values[i++ % values.length];
    };
    expect(scatterOffsets(boxes, area, seq())).toEqual(scatterOffsets(boxes, area, seq()));
  });

  it("copes with an area smaller than an icon", () => {
    const [o] = scatterOffsets([{ left: 0, top: 0, width: 100, height: 100 }], { width: 50, height: 50 }, () => 0.5);
    expect(o.x).toBe(0);
    expect(o.y).toBe(0);
  });
});
