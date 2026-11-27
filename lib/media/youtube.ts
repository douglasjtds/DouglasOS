import { YOUTUBE_EMBED_HOST, YOUTUBE_IFRAME_API_SRC } from "@/lib/media/source";
import type {
  MediaSourceAdapter,
  SourceEvent,
  SourceListener,
  SourceState,
  TrackPosition,
} from "@/lib/media/types";

/*
 * Minimal hand-written types for the YouTube IFrame Player API — only what
 * the adapter uses (no @types dependency). Reference:
 * https://developers.google.com/youtube/iframe_api_reference
 */
export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  nextVideo(): void;
  previousVideo(): void;
  playVideoAt(index: number): void;
  /** Re-cue a playlist (object syntax) — used to start at a random track. */
  cuePlaylist(args: { list: string; listType: "playlist"; index?: number }): void;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  getPlaylist(): string[] | null | undefined;
  getPlaylistIndex(): number;
  /** Not in the documented API, but exposed by the player; used for the title. */
  getVideoData?(): { title?: string; video_id?: string } | undefined;
  destroy(): void;
}

export interface YTPlayerEvent<T = number> {
  target: YTPlayer;
  data: T;
}

export interface YTPlayerOptions {
  host?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: YTPlayerEvent) => void;
    onError?: (event: YTPlayerEvent) => void;
  };
}

export interface YTNamespace {
  Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
  /** 1 once the API finished loading. */
  loaded?: number;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** `YT.PlayerState` codes. */
export const YT_STATE = {
  unstarted: -1,
  ended: 0,
  playing: 1,
  paused: 2,
  buffering: 3,
  cued: 5,
} as const;

/** `onError` codes. 101 and 150 both mean "the owner disabled embedding". */
export const YT_ERROR = {
  invalidParam: 2,
  html5: 5,
  notFound: 100,
  embedDisabled: 101,
  embedDisabledAlt: 150,
} as const;

export function isEmbedDisabledError(code: number): boolean {
  return code === YT_ERROR.embedDisabled || code === YT_ERROR.embedDisabledAlt;
}

/**
 * Map a raw player state to a source state, or null to ignore it. Inside a
 * playlist YouTube reports `ended`/`unstarted` between tracks; while the
 * visitor wants music (`active`) those are transitions (buffering), so the
 * assistant doesn't stop dancing between songs. Only the last track's end is
 * a real `ended`.
 */
export function mapPlayerState(
  code: number,
  ctx: { active: boolean; index: number; total: number },
): SourceState | null {
  switch (code) {
    case YT_STATE.playing:
      return "playing";
    case YT_STATE.paused:
      return "paused";
    case YT_STATE.buffering:
      return "buffering";
    case YT_STATE.cued:
      return "ready";
    case YT_STATE.unstarted:
      return ctx.active ? "buffering" : null;
    case YT_STATE.ended:
      return ctx.active && ctx.total > 0 && ctx.index < ctx.total - 1 ? "buffering" : "ended";
    default:
      return null;
  }
}

/**
 * What to do after a player error. Bad parameters (2) are fatal; anything
 * else (embedding disabled, removed/private video, HTML5 error) skips to the
 * next track, until every track of the playlist failed in a row.
 */
export function errorDecision(
  code: number,
  consecutiveFailures: number,
  total: number,
): "skip" | "fatal" {
  if (code === YT_ERROR.invalidParam || total <= 0) return "fatal";
  return consecutiveFailures >= total ? "fatal" : "skip";
}

/** The track after `index`, wrapping to the start (skips stay in the playlist). */
export function nextIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return (Math.max(index, -1) + 1) % total;
}

/**
 * A random track to start the playlist on. Never `avoid` (the previous
 * opening's track) when there's another choice, so reopening the player
 * always changes the song.
 */
export function randomStartIndex(total: number, random: () => number = Math.random, avoid?: number): number {
  if (total <= 1) return 0;
  const canAvoid = avoid !== undefined && avoid >= 0 && avoid < total;
  const slots = canAvoid ? total - 1 : total;
  const pick = Math.min(slots - 1, Math.max(0, Math.floor(random() * slots)));
  return canAvoid && pick >= avoid ? pick + 1 : pick;
}

/** The track the last opening started on (module-wide, across openings). */
let lastStartIndex: number | undefined;

/** Test seam: forget the previous opening's start track. */
export function resetRandomStart(): void {
  lastStartIndex = undefined;
}

let apiPromise: Promise<YTNamespace> | null = null;

/**
 * Load the IFrame Player API once (lazy — call it when the player window
 * mounts). Resolves with `window.YT`; rejects on a network error or timeout
 * (and allows a later retry).
 */
export function loadYouTubeIframeApi({ timeoutMs = 15_000 } = {}): Promise<YTNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.YT?.Player && window.YT.loaded === 1) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      apiPromise = null;
      script.remove();
      reject(error);
    };
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (settled || !window.YT) return;
      settled = true;
      clearTimeout(timer);
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = YOUTUBE_IFRAME_API_SRC;
    script.async = true;
    script.dataset.youtubeIframeApi = "";
    script.onerror = () => {
      clearTimeout(timer);
      fail(new Error("YouTube IFrame API failed to load"));
    };
    const timer = setTimeout(() => fail(new Error("YouTube IFrame API timed out")), timeoutMs);
    document.head.appendChild(script);
  });
  return apiPromise;
}

/** Test seam: forget the memoized loader. */
export function resetYouTubeApiLoader(): void {
  apiPromise = null;
}

export interface YouTubeAdapterOptions {
  playlistId: string;
  volume: number;
  muted: boolean;
  /** Page origin, passed to the player for its postMessage security check. */
  origin?: string;
  host?: string;
  /** Random source for the start track (test seam; defaults to `Math.random`). */
  random?: () => number;
}

/**
 * The YouTube source. Mounts an IFrame player (privacy-enhanced host) inside
 * `container`, cues the playlist at a random track without playing (a new
 * one on every opening), and translates the
 * player's states and errors into `SourceEvent`s. The player must stay
 * visible (YouTube's terms), so the UI renders `container` as the screen.
 */
export function createYouTubeAdapter(
  YT: YTNamespace,
  container: HTMLElement,
  options: YouTubeAdapterOptions,
): MediaSourceAdapter {
  const listeners = new Set<SourceListener>();
  let ready = false;
  let destroyed = false;
  /** The visitor wants music (pressed Play, not paused/stopped since). */
  let active = false;
  let pendingPlay = false;
  let failures = 0;
  let volume = options.volume;
  let muted = options.muted;
  let lastTitle: string | null = null;
  let lastIndex = -2;
  /** The random start track was picked (or the visitor already took over). */
  let randomized = false;

  const emit = (event: SourceEvent) => {
    if (destroyed) return;
    for (const listener of listeners) listener(event);
  };

  // The API replaces this element with its iframe; React never owns it.
  const mount = document.createElement("div");
  container.appendChild(mount);

  const position = (): TrackPosition | null => {
    const list = player.getPlaylist?.() ?? null;
    if (!list || list.length === 0) return null;
    return { index: Math.max(0, player.getPlaylistIndex()), total: list.length };
  };

  const title = (): string | null => {
    const value = player.getVideoData?.()?.title;
    return value ? value : null;
  };

  const reportTrack = () => {
    const nextTitle = title();
    const pos = position();
    if (nextTitle === lastTitle && (pos?.index ?? -1) === lastIndex) return;
    lastTitle = nextTitle;
    lastIndex = pos?.index ?? -1;
    emit({ type: "track", title: nextTitle, position: pos });
  };

  /**
   * Once the playlist is known, re-cue it at a random track. Returns true
   * when a re-cue is in flight (the next `cued` event reports the track).
   */
  /** Pick (once) the random start track; null while the playlist is unknown. */
  const pickStart = (): { index: number; current: number } | null => {
    if (randomized) return null;
    const pos = position();
    if (!pos) return null;
    randomized = true;
    const index = randomStartIndex(pos.total, options.random, lastStartIndex);
    lastStartIndex = index;
    return { index, current: pos.index };
  };

  const randomizeStart = (): boolean => {
    const pick = pickStart();
    if (!pick || pick.index === pick.current) return false;
    const { index } = pick;
    player.cuePlaylist({ list: options.playlistId, listType: "playlist", index });
    return true;
  };

  const applyVolume = () => {
    player.setVolume(volume);
    if (muted) player.mute();
    else player.unMute();
  };

  const player = new YT.Player(mount, {
    host: options.host ?? YOUTUBE_EMBED_HOST,
    width: "100%",
    height: "100%",
    playerVars: {
      listType: "playlist",
      list: options.playlistId,
      playsinline: 1,
      rel: 0,
      enablejsapi: 1,
      ...(options.origin ? { origin: options.origin } : {}),
    },
    events: {
      onReady: () => {
        if (destroyed) return;
        ready = true;
        applyVolume();
        if (pendingPlay) {
          // Play was pressed while loading: start straight on a random track.
          pendingPlay = false;
          emit({ type: "state", state: "ready" });
          reportTrack();
          const pick = pickStart();
          randomized = true;
          if (pick && pick.index !== pick.current) player.playVideoAt(pick.index);
          else player.playVideo();
          return;
        }
        const recueing = randomizeStart();
        emit({ type: "state", state: "ready" });
        if (!recueing) reportTrack();
      },
      onStateChange: (event) => {
        // The real API may only know the playlist once it's cued.
        if (event.data === YT_STATE.cued && !active && randomizeStart()) return;
        const pos = position();
        const state = mapPlayerState(event.data, {
          active,
          index: pos?.index ?? 0,
          total: pos?.total ?? 0,
        });
        if (state === null) return;
        if (state === "playing") {
          failures = 0;
          active = true;
        } else if (state === "paused" || state === "ended" || state === "ready") {
          active = false;
        }
        reportTrack();
        emit({ type: "state", state });
      },
      onError: (event) => {
        failures += 1;
        const pos = position();
        const total = pos?.total ?? 0;
        if (errorDecision(event.data, failures, total) === "fatal") {
          active = false;
          emit({ type: "fatal", code: event.data });
          return;
        }
        emit({ type: "skip", code: event.data });
        active = true;
        player.playVideoAt(nextIndex(pos?.index ?? -1, total));
      },
    },
  });

  return {
    play() {
      active = true;
      if (!ready) {
        pendingPlay = true;
        return;
      }
      randomized = true;
      player.playVideo();
    },
    pause() {
      active = false;
      pendingPlay = false;
      if (ready) player.pauseVideo();
    },
    stop() {
      active = false;
      pendingPlay = false;
      if (!ready) return;
      player.stopVideo();
      emit({ type: "state", state: "ready" });
    },
    next() {
      if (!ready) return;
      randomized = true;
      active = true;
      player.nextVideo();
    },
    prev() {
      if (!ready) return;
      randomized = true;
      active = true;
      player.previousVideo();
    },
    setVolume(next) {
      volume = Math.max(0, Math.min(100, Math.round(next)));
      if (ready) player.setVolume(volume);
    },
    mute(next) {
      muted = next;
      if (!ready) return;
      if (muted) player.mute();
      else player.unMute();
    },
    getTrackTitle() {
      return ready ? title() : null;
    },
    onEvent(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
      destroyed = true;
      listeners.clear();
      try {
        player.destroy();
      } catch {
        // The iframe may already be gone (window closed mid-load).
      }
      container.replaceChildren();
    },
  };
}
