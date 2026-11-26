import { beforeEach, describe, expect, it } from "vitest";
import {
  EASTER_EGG_STORAGE_KEY,
  selectComplete,
  selectFoundCount,
  useEasterEggStore,
} from "@/lib/store/easterEggStore";
import { EASTER_EGG_IDS } from "@/lib/easter-eggs/registry";
import { completionMessage, deliverCompletionReward } from "@/lib/easter-eggs/reward";
import { useAssistantStore } from "@/lib/store/assistantStore";

const store = () => useEasterEggStore.getState();

describe("easterEggStore", () => {
  beforeEach(() => store().reset());

  it("discover() is idempotent and says whether the egg was new", () => {
    expect(store().discover("protected-file", 1000)).toBe(true);
    expect(store().discover("protected-file", 2000)).toBe(false);
    expect(store().found).toEqual({ "protected-file": 1000 });
    expect(store().pending).toEqual(["protected-file"]);
    expect(selectFoundCount(store())).toBe(1);
  });

  it("can be called from plain code with no React around", () => {
    useEasterEggStore.getState().discover("real-404");
    expect(store().found["real-404"]).toEqual(expect.any(Number));
  });

  it("persists found eggs and pending toasts under a versioned key", () => {
    store().discover("trash-rescue", 42);
    const saved = JSON.parse(localStorage.getItem(EASTER_EGG_STORAGE_KEY)!);
    expect(saved.version).toBe(1);
    expect(saved.state).toEqual({ found: { "trash-rescue": 42 }, pending: ["trash-rescue"] });
  });

  it("drops unknown ids on load", async () => {
    localStorage.setItem(
      EASTER_EGG_STORAGE_KEY,
      JSON.stringify({
        state: { found: { "protected-file": 5, "konami-code": 6 }, pending: ["konami-code", "protected-file"] },
        version: 1,
      }),
    );
    await useEasterEggStore.persist.rehydrate();
    expect(store().found).toEqual({ "protected-file": 5 });
    expect(store().pending).toEqual(["protected-file"]);
  });

  it("migrates an older version through the same sanitizer", async () => {
    localStorage.setItem(
      EASTER_EGG_STORAGE_KEY,
      JSON.stringify({ state: { found: { "run-cmd": 7, bogus: 1 } }, version: 0 }),
    );
    await useEasterEggStore.persist.rehydrate();
    expect(store().found).toEqual({ "run-cmd": 7 });
    expect(store().pending).toEqual([]);
  });

  it("acknowledge() drops the head, and only the expected head", () => {
    store().discover("protected-file", 1);
    store().discover("trash-rescue", 2);
    store().acknowledge("trash-rescue");
    expect(store().pending).toEqual(["protected-file", "trash-rescue"]);
    store().acknowledge("protected-file");
    store().acknowledge("protected-file");
    expect(store().pending).toEqual(["trash-rescue"]);
  });

  it("reset() forgets everything", () => {
    store().discover("protected-file", 1);
    store().reset();
    expect(store().found).toEqual({});
    expect(store().pending).toEqual([]);
    expect(JSON.parse(localStorage.getItem(EASTER_EGG_STORAGE_KEY)!).state.found).toEqual({});
  });

  it("completing the set queues the reward and unlocks the secret wallpaper", () => {
    EASTER_EGG_IDS.forEach((id, i) => store().discover(id, i + 1));
    expect(selectComplete(store())).toBe(true);
    expect(store().pending.at(-1)).toBe("complete");
    expect(store().pending.filter((p) => p === "complete")).toHaveLength(1);
  });
});

describe("completion reward", () => {
  beforeEach(() => {
    useAssistantStore.setState({ visible: false, dismissed: false, state: "idle", queue: [], fired: [] });
  });

  it("goes to mini Douglas when he's around, offering the CV first", () => {
    expect(deliverCompletionReward()).toBe("assistant");
    const said = useAssistantStore.getState().queue[0];
    expect(said.id).toBe("eggsComplete");
    expect(said.actions[0]).toEqual({ kind: "downloadCv" });
  });

  it("falls back to the toast's own balloon after 'Not now'", () => {
    useAssistantStore.setState({ dismissed: true });
    expect(deliverCompletionReward()).toBe("balloon");
    expect(useAssistantStore.getState().queue).toEqual([]);
    expect(completionMessage().actions).toContainEqual({ kind: "openApp", app: "display" });
  });
});
