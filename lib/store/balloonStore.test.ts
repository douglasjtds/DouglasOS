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
