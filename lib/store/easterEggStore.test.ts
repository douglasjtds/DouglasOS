import { beforeEach, describe, expect, it } from "vitest";
import { useEasterEggStore } from "@/lib/store/easterEggStore";
import { EASTER_EGG_STORAGE_KEY } from "@/lib/easterEgg";

describe("easterEggStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useEasterEggStore.setState({ active: null, seq: 0 });
  });

  it("plays A, B, C on successive opens in a session", () => {
    const seen: (string | null)[] = [];
    for (let i = 0; i < 4; i++) {
      useEasterEggStore.getState().open();
      seen.push(useEasterEggStore.getState().active);
      useEasterEggStore.getState().close();
    }
    expect(seen).toEqual(["not-found", "scramble", "access-denied", "not-found"]);
    expect(sessionStorage.getItem(EASTER_EGG_STORAGE_KEY)).toBe("4");
  });

  it("ignores opens while an egg is playing", () => {
    useEasterEggStore.getState().open();
    const { seq } = useEasterEggStore.getState();
    useEasterEggStore.getState().open();
    expect(useEasterEggStore.getState().seq).toBe(seq);
    expect(useEasterEggStore.getState().active).toBe("not-found");
  });
});
