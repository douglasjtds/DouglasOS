import { describe, expect, it } from "vitest";
import type { TableauCard } from "@/lib/games/spider/engine";
import { fanLimits, fanOffsets, fanPositions, tableMetrics } from "@/components/apps/games/spider/layout";

const c = (faceUp: boolean): TableauCard => ({ card: { id: "x", suit: "spades", rank: 5 }, faceUp });
const column = (down: number, up: number) => [
  ...Array.from({ length: down }, () => c(false)),
  ...Array.from({ length: up }, () => c(true)),
];

describe("tableMetrics", () => {
  it("uses the full card size on a wide board and before measuring", () => {
    expect(tableMetrics(1200, false).cardW).toBe(71);
    expect(tableMetrics(0, false)).toMatchObject({ cardW: 71, cardH: 96 });
  });

  it("fits ten columns on a 390px phone", () => {
    const m = tableMetrics(390, true);
    expect(m.cardW).toBeGreaterThanOrEqual(32);
    expect(m.cardW).toBeLessThanOrEqual(36);
    expect(10 * m.cardW + 9 * m.gap + 2 * m.pad).toBeLessThanOrEqual(390);
    expect(m.cardH).toBeGreaterThan(m.cardW);
  });
});

describe("fanOffsets", () => {
  it("keeps the preferred offsets when the column fits", () => {
    const limits = fanLimits(96);
    expect(fanOffsets(column(5, 1), 96, 1000)).toEqual({ down: limits.down, up: limits.up });
  });

  it("compresses face-up steps first, then face-down ones, to fit", () => {
    const tall = column(5, 15);
    const off = fanOffsets(tall, 96, 400);
    const { height } = fanPositions(tall, 96, off);
    expect(height).toBeLessThanOrEqual(400);
    expect(off.up).toBeLessThan(fanLimits(96).up);
    expect(off.up).toBeGreaterThan(off.down);
  });

  it("never goes below the minimum steps", () => {
    const off = fanOffsets(column(10, 30), 96, 100);
    const limits = fanLimits(96);
    expect(off).toEqual({ down: limits.minDown, up: limits.minUp });
  });
});

describe("fanPositions", () => {
  it("stacks cards with the face-down and face-up steps", () => {
    const { tops, height } = fanPositions(column(2, 2), 96, { down: 5, up: 20 });
    expect(tops).toEqual([0, 5, 10, 30]);
    expect(height).toBe(126);
    expect(fanPositions([], 96, { down: 5, up: 20 }).height).toBe(96);
  });
});
