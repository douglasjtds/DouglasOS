import { beforeEach, describe, expect, it } from "vitest";
import {
  dequeueBalloon,
  enqueueBalloon,
  selectActiveBalloon,
  useBalloonStore,
} from "@/lib/store/balloonStore";

describe("balloon queue helpers", () => {
  it("enqueues once and dequeues anywhere in the line", () => {
    const q = enqueueBalloon(enqueueBalloon([], "welcome"), "assistant");
    expect(q).toEqual(["welcome", "assistant"]);
    expect(enqueueBalloon(q, "welcome")).toBe(q);
    expect(dequeueBalloon(q, "assistant")).toEqual(["welcome"]);
    expect(dequeueBalloon(q, "messenger")).toBe(q);
  });

  it("lets every other owner go ahead of the easter-egg toast (stage 11)", () => {
    // Waiting: a regular owner jumps the yielding one.
    expect(enqueueBalloon(["welcome", "easterEgg"], "recycleBin")).toEqual(["welcome", "recycleBin", "easterEgg"]);
    // On screen: it is pushed back (and comes back once the slot frees up).
    expect(enqueueBalloon(["easterEgg"], "assistant")).toEqual(["assistant", "easterEgg"]);
    // The yielding owner itself always joins at the end.
    expect(enqueueBalloon(["assistant"], "easterEgg")).toEqual(["assistant", "easterEgg"]);
  });
});

describe("useBalloonStore", () => {
  beforeEach(() => useBalloonStore.setState({ queue: [] }));

  it("shows one owner at a time, first come first served", () => {
    const { request, release } = useBalloonStore.getState();
    expect(selectActiveBalloon(useBalloonStore.getState())).toBeNull();
    request("welcome");
    request("assistant");
    expect(selectActiveBalloon(useBalloonStore.getState())).toBe("welcome");
    release("welcome");
    expect(selectActiveBalloon(useBalloonStore.getState())).toBe("assistant");
    release("assistant");
    expect(selectActiveBalloon(useBalloonStore.getState())).toBeNull();
  });
});
