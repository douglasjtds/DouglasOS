import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { danceCommand, installDanceSync } from "@/lib/media/danceSync";
import { useAssistantStore, initialAssistantState } from "@/lib/store/assistantStore";
import { usePlaybackStore } from "@/lib/store/playbackStore";

const playback = () => usePlaybackStore.getState();
const assistant = () => useAssistantStore.getState();

describe("danceCommand", () => {
  it("dances on play, keeps dancing through buffering, stops otherwise", () => {
    expect(danceCommand(false, "playing")).toBe("dance");
    expect(danceCommand(true, "playing")).toBeNull();
    expect(danceCommand(true, "buffering")).toBeNull();
    for (const status of ["paused", "ready", "ended", "error", "idle"] as const) {
      expect(danceCommand(true, status)).toBe("stop");
      expect(danceCommand(false, status)).toBeNull();
    }
  });
});

describe("installDanceSync (assistant integration)", () => {
  let uninstall: () => void;

  beforeEach(() => {
    useAssistantStore.setState(initialAssistantState(null));
    playback().reset();
    uninstall = installDanceSync();
  });
  afterEach(() => uninstall());

  it("is idempotent", () => {
    expect(installDanceSync()).toBe(uninstall);
  });

  it("dances while the music plays and says the post-dance line when it stops", () => {
    playback().startLoading();
    playback().applySourceEvent({ type: "state", state: "ready" });
    expect(assistant().state).toBe("idle");

    playback().applySourceEvent({ type: "state", state: "playing" });
    expect(assistant()).toMatchObject({ state: "dancing", visible: true });

    // Track change / skip: still dancing, nothing said.
    playback().applySourceEvent({ type: "skip", code: 150 });
    playback().applySourceEvent({ type: "state", state: "playing" });
    expect(assistant().state).toBe("dancing");
    expect(assistant().queue).toHaveLength(0);

    playback().applySourceEvent({ type: "state", state: "paused" });
    expect(assistant().state).toBe("talking");
    const line = assistant().queue[0];
    expect(line.id).toBe("afterDance");
    // The line offers "see a project" (the featured case study) first.
    expect(line.actions[0]).toEqual({ kind: "openProject" });
  });

  it("stops the dance when the window closes", () => {
    playback().applySourceEvent({ type: "state", state: "playing" });
    playback().reset();
    expect(assistant().state).not.toBe("dancing");
    expect(assistant().queue.map((m) => m.id)).toContain("afterDance");
  });

  it("respects a dismissed assistant", () => {
    assistant().dismiss();
    playback().applySourceEvent({ type: "state", state: "playing" });
    expect(assistant()).toMatchObject({ state: "idle", visible: false });
    playback().applySourceEvent({ type: "state", state: "paused" });
    expect(assistant().queue).toHaveLength(0);
  });

  it("dances again on the next play", () => {
    playback().applySourceEvent({ type: "state", state: "playing" });
    playback().applySourceEvent({ type: "state", state: "ended" });
    assistant().closeMessage();
    playback().applySourceEvent({ type: "state", state: "playing" });
    expect(assistant().state).toBe("dancing");
  });
});
