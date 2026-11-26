import { describe, expect, it } from "vitest";
import {
  PAINT_HISTORY_LIMIT,
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "@/lib/paint/history";

describe("paint history", () => {
  it("starts with nothing to undo or redo", () => {
    const h = createHistory(0);
    expect(h.present).toBe(0);
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
    expect(h.limit).toBe(PAINT_HISTORY_LIMIT);
  });

  it("undoes and redoes in order", () => {
    let h = createHistory(0);
    h = pushHistory(h, 1);
    h = pushHistory(h, 2);
    expect(h.present).toBe(2);

    h = undoHistory(h);
    expect(h.present).toBe(1);
    h = undoHistory(h);
    expect(h.present).toBe(0);
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(true);

    h = redoHistory(h);
    expect(h.present).toBe(1);
    h = redoHistory(h);
    expect(h.present).toBe(2);
    expect(canRedo(h)).toBe(false);
  });

  it("undo/redo past the ends are no-ops that return the same object", () => {
    const h = createHistory("a");
    expect(undoHistory(h)).toBe(h);
    expect(redoHistory(h)).toBe(h);
  });

  it("a new edit after an undo drops the redo branch", () => {
    let h = createHistory(0);
    h = pushHistory(h, 1);
    h = pushHistory(h, 2);
    h = undoHistory(h);
    h = pushHistory(h, 3);
    expect(h.present).toBe(3);
    expect(canRedo(h)).toBe(false);
    h = undoHistory(h);
    expect(h.present).toBe(1);
  });

  it("keeps at most `limit` undo steps, dropping the oldest", () => {
    let h = createHistory(0, 3);
    for (let i = 1; i <= 10; i++) h = pushHistory(h, i);
    expect(h.past).toEqual([7, 8, 9]);
    expect(h.present).toBe(10);
    while (canUndo(h)) h = undoHistory(h);
    expect(h.present).toBe(7);
    expect(h.future).toEqual([8, 9, 10]);
  });

  it("never mutates the previous history", () => {
    const h0 = createHistory(0);
    const h1 = pushHistory(h0, 1);
    undoHistory(h1);
    expect(h0).toEqual({ past: [], present: 0, future: [], limit: PAINT_HISTORY_LIMIT });
    expect(h1.past).toEqual([0]);
    expect(h1.present).toBe(1);
  });

  it("rejects a nonsense limit", () => {
    expect(() => createHistory(0, 0)).toThrow();
    expect(() => createHistory(0, 1.5)).toThrow();
  });
});
