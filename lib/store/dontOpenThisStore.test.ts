import { beforeEach, describe, expect, it } from "vitest";
import { useDontOpenThisStore } from "@/lib/store/dontOpenThisStore";
import { EASTER_EGG_STORAGE_KEY } from "@/lib/easterEgg";
import { useEasterEggStore } from "@/lib/store/easterEggStore";

describe("dontOpenThisStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useDontOpenThisStore.setState({ active: null, seq: 0 });
  });

  it("plays A, B, C on successive opens in a session", () => {
    const seen: (string | null)[] = [];
    for (let i = 0; i < 4; i++) {
      useDontOpenThisStore.getState().open();
      seen.push(useDontOpenThisStore.getState().active);
      useDontOpenThisStore.getState().close();
    }
    expect(seen).toEqual(["not-found", "scramble", "access-denied", "not-found"]);
    expect(sessionStorage.getItem(EASTER_EGG_STORAGE_KEY)).toBe("4");
  });

  it("each egg counts its own discovery (egg-404, egg-runaway, egg-scold)", () => {
    useEasterEggStore.getState().reset();
    useDontOpenThisStore.getState().open();
    expect(Object.keys(useEasterEggStore.getState().found)).toEqual(["egg-404"]);
    useDontOpenThisStore.getState().close();
    useDontOpenThisStore.getState().open();
    useDontOpenThisStore.getState().close();
    useDontOpenThisStore.getState().open();
    expect(Object.keys(useEasterEggStore.getState().found).sort()).toEqual(["egg-404", "egg-runaway", "egg-scold"]);
  });

  it("ignores opens while an egg is playing", () => {
    useDontOpenThisStore.getState().open();
    const { seq } = useDontOpenThisStore.getState();
    useDontOpenThisStore.getState().open();
    expect(useDontOpenThisStore.getState().seq).toBe(seq);
    expect(useDontOpenThisStore.getState().active).toBe("not-found");
  });
});
