import { describe, expect, it } from "vitest";
import {
  HISTORY_LIMIT,
  canGoBack,
  canGoForward,
  createHistory,
  currentRoute,
  goBack,
  goForward,
  pushRoute,
  sanitizeHistory,
} from "@/lib/store/routeHistory";

describe("routeHistory", () => {
  it("starts with one entry and nowhere to go", () => {
    const h = createHistory("home");
    expect(currentRoute(h)).toBe("home");
    expect(canGoBack(h)).toBe(false);
    expect(canGoForward(h)).toBe(false);
  });

  it("push → back → forward walks the entries", () => {
    let h = pushRoute(pushRoute(createHistory("home"), "a"), "b");
    expect(h).toEqual({ entries: ["home", "a", "b"], index: 2 });
    h = goBack(h);
    expect(currentRoute(h)).toBe("a");
    expect(canGoForward(h)).toBe(true);
    h = goBack(goBack(h));
    expect(currentRoute(h)).toBe("home");
    h = goForward(h);
    expect(currentRoute(h)).toBe("a");
  });

  it("pushing after going back drops the forward stack", () => {
    const h = pushRoute(goBack(pushRoute(pushRoute(createHistory("home"), "a"), "b")), "c");
    expect(h).toEqual({ entries: ["home", "a", "c"], index: 2 });
    expect(canGoForward(h)).toBe(false);
  });

  it("pushing the current route is a no-op (same object)", () => {
    const h = pushRoute(createHistory("home"), "a");
    expect(pushRoute(h, "a")).toBe(h);
  });

  it("back/forward at the ends return the same object", () => {
    const h = createHistory("home");
    expect(goBack(h)).toBe(h);
    expect(goForward(h)).toBe(h);
  });

  it("caps the history length, dropping the oldest entries", () => {
    let h = createHistory("r0");
    for (let i = 1; i < HISTORY_LIMIT + 10; i++) h = pushRoute(h, `r${i}`);
    expect(h.entries).toHaveLength(HISTORY_LIMIT);
    expect(currentRoute(h)).toBe(`r${HISTORY_LIMIT + 9}`);
    expect(h.entries[0]).toBe("r10");
  });
});

describe("sanitizeHistory", () => {
  const valid = (r: string) => ["home", "a", "b"].includes(r);

  it("keeps a valid history as is", () => {
    expect(sanitizeHistory({ entries: ["home", "a", "b"], index: 1 }, valid)).toEqual({
      entries: ["home", "a", "b"],
      index: 1,
    });
  });

  it("drops removed routes, collapses the duplicates left behind and keeps the position", () => {
    // "gone" sat between two "a" visits and was the current page.
    expect(
      sanitizeHistory({ entries: ["home", "a", "gone", "a", "b"], index: 2 }, valid),
    ).toEqual({ entries: ["home", "a", "b"], index: 1 });
  });

  it("falls forward to the first survivor when everything up to the index is gone", () => {
    expect(sanitizeHistory({ entries: ["gone", "b"], index: 0 }, valid)).toEqual({
      entries: ["b"],
      index: 0,
    });
  });

  it("rejects junk", () => {
    expect(sanitizeHistory(undefined, valid)).toBeNull();
    expect(sanitizeHistory("home", valid)).toBeNull();
    expect(sanitizeHistory({ entries: "home" }, valid)).toBeNull();
    expect(sanitizeHistory({ entries: [1, null, "gone"], index: 0 }, valid)).toBeNull();
  });

  it("tolerates a missing or out-of-range index", () => {
    expect(sanitizeHistory({ entries: ["home", "a"] }, valid)).toEqual({
      entries: ["home", "a"],
      index: 1,
    });
    expect(sanitizeHistory({ entries: ["home", "a"], index: 99 }, valid)?.index).toBe(1);
    expect(sanitizeHistory({ entries: ["home", "a"], index: -5 }, valid)?.index).toBe(0);
  });
});
