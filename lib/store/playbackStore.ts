import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SourceEvent, TrackPosition } from "@/lib/media/types";

/**
 * DouglasOS Media Player playback state (DESKTOP-INTERFACE-SPEC → Media
 * Player). Pure state; the player window owns the source adapter and feeds
 * its events in through `applySourceEvent`. The tray reads it (now-playing
 * note, volume) and `lib/media/danceSync.ts` syncs mini Douglas's dance.
 * Only volume + mute persist (`douglasos:media`, localStorage).
 */
export type PlaybackStatus =
  /** No player (window closed). */
  | "idle"
  /** Window open, YouTube API / player loading. */
  | "loading"
  /** Cued or stopped: waiting for Play. */
  | "ready"
  | "buffering"
  | "playing"
  | "paused"
  /** The playlist reached its end. */
  | "ended"
  /** Nothing can play (see `failure`). */
  | "error";

export type PlaybackNotice =
  /** A video couldn't be embedded and was skipped. */
  | { kind: "skipped"; code: number }
  /** Paused because the window was minimized/hidden (the player must stay visible). */
  | { kind: "hiddenPause" };

export type PlaybackFailure = "unplayable" | "loadFailed";

export const DEFAULT_VOLUME = 60;

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  return Math.max(0, Math.min(100, Math.round(value)));
}

interface PlaybackStoreState {
  status: PlaybackStatus;
  title: string | null;
  position: TrackPosition | null;
  notice: PlaybackNotice | null;
  failure: PlaybackFailure | null;
  volume: number;
  muted: boolean;

  /** The player window mounted and started loading the source. */
  startLoading: () => void;
  /** Feed one adapter event into the store. */
  applySourceEvent: (event: SourceEvent) => void;
  /** Paused by the shell because the player is no longer visible. */
  pausedWhileHidden: () => void;
  /** The source couldn't load at all (network/timeout). */
  failLoading: () => void;
  /** Close the error dialog (state stays `error` until the next Play). */
  clearFailure: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  /** Window closed: back to idle (volume + mute stay). */
  reset: () => void;
}

const SESSION_DEFAULTS = {
  status: "idle" as PlaybackStatus,
  title: null,
  position: null,
  notice: null,
  failure: null,
};

export const usePlaybackStore = create<PlaybackStoreState>()(
  persist(
    (set) => ({
      ...SESSION_DEFAULTS,
      volume: DEFAULT_VOLUME,
      muted: false,

      startLoading: () => set({ ...SESSION_DEFAULTS, status: "loading" }),

      applySourceEvent: (event) =>
        set((s) => {
          switch (event.type) {
            case "state": {
              // A stop/pause by the visitor clears the old notices; playing
              // clears only the "paused while hidden" one (a skip notice
              // stays up while the next video plays, so it can be read).
              const notice =
                event.state === "playing"
                  ? s.notice?.kind === "hiddenPause"
                    ? null
                    : s.notice
                  : event.state === "buffering"
                    ? s.notice
                    : s.notice?.kind === "hiddenPause" && event.state === "paused"
                      ? s.notice
                      : null;
              return { status: event.state, notice, failure: null };
            }
            case "track":
              return { title: event.title, position: event.position };
            case "skip":
              return { notice: { kind: "skipped", code: event.code }, status: "buffering" };
            case "fatal":
              return { status: "error", failure: "unplayable", notice: null };
          }
        }),

      pausedWhileHidden: () => set({ notice: { kind: "hiddenPause" } }),

      failLoading: () => set({ status: "error", failure: "loadFailed", notice: null }),

      clearFailure: () => set({ failure: null }),

      setVolume: (volume) => set({ volume: clampVolume(volume) }),
      setMuted: (muted) => set({ muted }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),

      reset: () => set(SESSION_DEFAULTS),
    }),
    {
      name: "douglasos:media",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ volume: s.volume, muted: s.muted }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as { volume?: unknown; muted?: unknown };
        return {
          ...current,
          volume: typeof p.volume === "number" ? clampVolume(p.volume) : current.volume,
          muted: typeof p.muted === "boolean" ? p.muted : current.muted,
        };
      },
    },
  ),
);

/** The music is actually audible (drives the tray note and the dance). */
export function isPlaying(status: PlaybackStatus): boolean {
  return status === "playing";
}
