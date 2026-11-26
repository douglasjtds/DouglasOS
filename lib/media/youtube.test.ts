import { afterEach, describe, expect, it, vi } from "vitest";
import {
  YT_STATE,
  createYouTubeAdapter,
  errorDecision,
  isEmbedDisabledError,
  loadYouTubeIframeApi,
  mapPlayerState,
  nextIndex,
  resetYouTubeApiLoader,
} from "@/lib/media/youtube";
import { YOUTUBE_EMBED_HOST, YOUTUBE_IFRAME_API_SRC, YOUTUBE_PLAYLIST_ID, youtubePlaylistUrl } from "@/lib/media/source";
import type { SourceEvent } from "@/lib/media/types";
import { createFakeYT, lastPlayer } from "@/test/fakeYouTube";

function setup(options: { volume?: number; muted?: boolean } = {}) {
  const YT = createFakeYT();
  const container = document.createElement("div");
  const adapter = createYouTubeAdapter(YT, container, {
    playlistId: YOUTUBE_PLAYLIST_ID,
    volume: options.volume ?? 50,
    muted: options.muted ?? false,
    origin: "http://localhost",
  });
  const events: SourceEvent[] = [];
  adapter.onEvent((e) => events.push(e));
  return { adapter, container, events, player: lastPlayer() };
}

const states = (events: SourceEvent[]) =>
  events.filter((e) => e.type === "state").map((e) => (e as { state: string }).state);

describe("source constants", () => {
  it("keeps the playlist in one constant and uses the privacy-enhanced host", () => {
    expect(YOUTUBE_PLAYLIST_ID).toBe("PLdw3FCGShY-U");
    expect(YOUTUBE_EMBED_HOST).toBe("https://www.youtube-nocookie.com");
    expect(youtubePlaylistUrl()).toBe("https://www.youtube.com/playlist?list=PLdw3FCGShY-U");
  });
});

describe("mapPlayerState", () => {
  const ctx = { active: true, index: 0, total: 3 };
  it("maps the documented states", () => {
    expect(mapPlayerState(YT_STATE.playing, ctx)).toBe("playing");
    expect(mapPlayerState(YT_STATE.paused, ctx)).toBe("paused");
    expect(mapPlayerState(YT_STATE.buffering, ctx)).toBe("buffering");
    expect(mapPlayerState(YT_STATE.cued, ctx)).toBe("ready");
    expect(mapPlayerState(42, ctx)).toBeNull();
  });

  it("treats track changes inside the playlist as buffering, not an end", () => {
    expect(mapPlayerState(YT_STATE.ended, ctx)).toBe("buffering");
    expect(mapPlayerState(YT_STATE.unstarted, ctx)).toBe("buffering");
    expect(mapPlayerState(YT_STATE.ended, { ...ctx, index: 2 })).toBe("ended");
  });

  it("ignores 'unstarted' while the visitor isn't playing", () => {
    expect(mapPlayerState(YT_STATE.unstarted, { ...ctx, active: false })).toBeNull();
    expect(mapPlayerState(YT_STATE.ended, { ...ctx, active: false })).toBe("ended");
  });
});

describe("error handling decisions", () => {
  it("recognizes both 'embedding disabled' codes", () => {
    expect(isEmbedDisabledError(101)).toBe(true);
    expect(isEmbedDisabledError(150)).toBe(true);
    expect(isEmbedDisabledError(100)).toBe(false);
  });

  it("skips until every track failed in a row; bad params are fatal", () => {
    expect(errorDecision(150, 1, 3)).toBe("skip");
    expect(errorDecision(101, 2, 3)).toBe("skip");
    expect(errorDecision(150, 3, 3)).toBe("fatal");
    expect(errorDecision(2, 1, 3)).toBe("fatal");
    expect(errorDecision(150, 1, 0)).toBe("fatal");
  });

  it("wraps to the start of the playlist", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(0);
    expect(nextIndex(-1, 3)).toBe(0);
  });
});

describe("createYouTubeAdapter", () => {
  it("cues the playlist on the nocookie host without autoplay", () => {
    const { player, container } = setup();
    expect(player.options.host).toBe(YOUTUBE_EMBED_HOST);
    expect(player.options.playerVars).toMatchObject({ listType: "playlist", list: YOUTUBE_PLAYLIST_ID, playsinline: 1 });
    expect(player.options.playerVars).not.toHaveProperty("autoplay");
    expect(container.contains(player.element)).toBe(true);
    expect(player.calls).toEqual([]);
  });

  it("applies volume/mute on ready and reports ready + the track", () => {
    const { player, events } = setup({ volume: 30, muted: true });
    player.emitReady();
    expect(player.calls).toEqual(["volume:30", "mute"]);
    expect(states(events)).toEqual(["ready"]);
    expect(events).toContainEqual({ type: "track", title: "Song A", position: { index: 0, total: 3 } });
  });

  it("queues a Play pressed before the player is ready", () => {
    const { adapter, player } = setup();
    adapter.play();
    expect(player.calls).toEqual([]);
    player.emitReady();
    expect(player.calls.at(-1)).toBe("play");
  });

  it("maps playback, keeps buffering between tracks and ends on the last one", () => {
    const { adapter, player, events } = setup();
    player.emitReady();
    adapter.play();
    player.emitState(YT_STATE.playing);
    player.emitState(YT_STATE.ended); // track 1 of 3 ended → next is coming
    player.index = 1;
    player.emitState(YT_STATE.playing);
    expect(events).toContainEqual({ type: "track", title: "Song B", position: { index: 1, total: 3 } });
    player.index = 2;
    player.emitState(YT_STATE.ended);
    expect(states(events)).toEqual(["ready", "playing", "buffering", "playing", "ended"]);
  });

  it("forwards the transport commands", () => {
    const { adapter, player, events } = setup();
    player.emitReady();
    adapter.play();
    adapter.pause();
    adapter.next();
    adapter.prev();
    adapter.setVolume(140);
    adapter.mute(true);
    adapter.mute(false);
    adapter.stop();
    expect(player.calls.slice(2)).toEqual(["play", "pause", "next", "prev", "volume:100", "mute", "unmute", "stop"]);
    expect(states(events).at(-1)).toBe("ready");
    expect(adapter.getTrackTitle()).toBe("Song A");
  });

  it("skips a video with embedding disabled and keeps going", () => {
    const { adapter, player, events } = setup();
    player.emitReady();
    adapter.play();
    player.emitError(150);
    expect(events).toContainEqual({ type: "skip", code: 150 });
    expect(player.calls.at(-1)).toBe("playAt:1");
    player.emitState(YT_STATE.playing); // the next one plays → the failure streak resets
    player.emitError(101);
    player.emitError(101);
    expect(events.filter((e) => e.type === "fatal")).toHaveLength(0);
  });

  it("gives up when every track fails in a row", () => {
    const { adapter, player, events } = setup();
    player.emitReady();
    adapter.play();
    player.emitError(150);
    player.emitError(101);
    player.emitError(150);
    expect(events.filter((e) => e.type === "skip")).toHaveLength(2);
    expect(events.at(-1)).toEqual({ type: "fatal", code: 150 });
  });

  it("destroys the player and clears the screen", () => {
    const { adapter, player, container, events } = setup();
    adapter.destroy();
    expect(player.destroyed).toBe(true);
    expect(container.childElementCount).toBe(0);
    player.emitReady();
    expect(events).toEqual([]);
  });
});

describe("loadYouTubeIframeApi", () => {
  afterEach(() => {
    resetYouTubeApiLoader();
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
    document.querySelectorAll("script[data-youtube-iframe-api]").forEach((s) => s.remove());
    vi.useRealTimers();
  });

  it("injects the script once and resolves when the API calls back", async () => {
    const first = loadYouTubeIframeApi();
    const second = loadYouTubeIframeApi();
    expect(second).toBe(first);
    const scripts = document.querySelectorAll<HTMLScriptElement>("script[data-youtube-iframe-api]");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe(YOUTUBE_IFRAME_API_SRC);
    window.YT = createFakeYT();
    window.onYouTubeIframeAPIReady?.();
    await expect(first).resolves.toBe(window.YT);
  });

  it("resolves at once when the API is already there", async () => {
    window.YT = createFakeYT();
    await expect(loadYouTubeIframeApi()).resolves.toBe(window.YT);
    expect(document.querySelector("script[data-youtube-iframe-api]")).toBeNull();
  });

  it("rejects on a network error and allows a retry", async () => {
    const attempt = loadYouTubeIframeApi();
    document.querySelector<HTMLScriptElement>("script[data-youtube-iframe-api]")!.onerror!(new Event("error"));
    await expect(attempt).rejects.toThrow();
    expect(document.querySelector("script[data-youtube-iframe-api]")).toBeNull();
    expect(loadYouTubeIframeApi()).not.toBe(attempt);
  });

  it("rejects after the timeout", async () => {
    vi.useFakeTimers();
    const attempt = loadYouTubeIframeApi({ timeoutMs: 1000 });
    vi.advanceTimersByTime(1000);
    await expect(attempt).rejects.toThrow(/timed out/);
  });
});
