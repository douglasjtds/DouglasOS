import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_VOLUME, clampVolume, isPlaying, usePlaybackStore } from "@/lib/store/playbackStore";

const store = () => usePlaybackStore.getState();

describe("playbackStore", () => {
  beforeEach(() => {
    usePlaybackStore.setState({ volume: DEFAULT_VOLUME, muted: false });
    store().reset();
  });

  it("starts idle and loads when the window opens", () => {
    expect(store().status).toBe("idle");
    store().startLoading();
    expect(store().status).toBe("loading");
  });

  it("follows the source's states and track", () => {
    store().startLoading();
    store().applySourceEvent({ type: "state", state: "ready" });
    store().applySourceEvent({ type: "track", title: "Song A", position: { index: 0, total: 3 } });
    store().applySourceEvent({ type: "state", state: "playing" });
    expect(store()).toMatchObject({ status: "playing", title: "Song A", position: { index: 0, total: 3 } });
    expect(isPlaying(store().status)).toBe(true);
  });

  it("shows a skip notice while the next video loads and plays", () => {
    store().applySourceEvent({ type: "state", state: "playing" });
    store().applySourceEvent({ type: "skip", code: 150 });
    expect(store()).toMatchObject({ status: "buffering", notice: { kind: "skipped", code: 150 } });
    store().applySourceEvent({ type: "state", state: "playing" });
    expect(store().notice).toEqual({ kind: "skipped", code: 150 });
    store().applySourceEvent({ type: "state", state: "ready" });
    expect(store().notice).toBeNull();
  });

  it("keeps the 'paused while hidden' notice through the pause, clears it on play", () => {
    store().applySourceEvent({ type: "state", state: "playing" });
    store().pausedWhileHidden();
    store().applySourceEvent({ type: "state", state: "paused" });
    expect(store().notice).toEqual({ kind: "hiddenPause" });
    store().applySourceEvent({ type: "state", state: "playing" });
    expect(store().notice).toBeNull();
  });

  it("records fatal and load failures for the error dialog", () => {
    store().applySourceEvent({ type: "fatal", code: 150 });
    expect(store()).toMatchObject({ status: "error", failure: "unplayable" });
    store().clearFailure();
    expect(store()).toMatchObject({ status: "error", failure: null });
    store().failLoading();
    expect(store().failure).toBe("loadFailed");
  });

  it("clamps volume and toggles mute", () => {
    store().setVolume(140);
    expect(store().volume).toBe(100);
    store().setVolume(-3);
    expect(store().volume).toBe(0);
    store().toggleMute();
    expect(store().muted).toBe(true);
    expect(clampVolume(Number.NaN)).toBe(DEFAULT_VOLUME);
  });

  it("persists only volume + mute", () => {
    store().setVolume(35);
    store().setMuted(true);
    store().applySourceEvent({ type: "track", title: "Secret", position: null });
    const saved = JSON.parse(localStorage.getItem("douglasos:media")!);
    expect(saved.state).toEqual({ volume: 35, muted: true });
  });

  it("rehydrates a sane volume from storage", async () => {
    localStorage.setItem("douglasos:media", JSON.stringify({ state: { volume: 999, muted: "yes" }, version: 1 }));
    await usePlaybackStore.persist.rehydrate();
    expect(store().volume).toBe(100);
    expect(store().muted).toBe(false);
  });

  it("reset (window closed) keeps volume + mute", () => {
    store().setVolume(20);
    store().applySourceEvent({ type: "state", state: "playing" });
    store().reset();
    expect(store()).toMatchObject({ status: "idle", title: null, volume: 20 });
  });
});
