/**
 * Source adapter contract for DouglasOS Media Player. The player UI and the
 * playback store only talk to this interface, so a radio stream or local
 * files can be added later as another adapter. Only the YouTube adapter
 * (`lib/media/youtube.ts`) ships.
 */

/** Playback states a source reports (`ready` also means "stopped"). */
export type SourceState = "ready" | "buffering" | "playing" | "paused" | "ended";

export interface TrackPosition {
  /** 0-based index in the playlist. */
  index: number;
  total: number;
}

export type SourceEvent =
  | { type: "state"; state: SourceState }
  /** The current track (title as the source provides it) changed. */
  | { type: "track"; title: string | null; position: TrackPosition | null }
  /** A track couldn't play (e.g. embedding disabled) and was skipped. */
  | { type: "skip"; code: number }
  /** Nothing in the source can play (every track failed, or a fatal error). */
  | { type: "fatal"; code: number };

export type SourceListener = (event: SourceEvent) => void;

export interface MediaSourceAdapter {
  /** Start or resume. Always called from a user gesture. */
  play(): void;
  pause(): void;
  /** Stop and rewind; reports `ready`. */
  stop(): void;
  next(): void;
  prev(): void;
  /** 0–100. */
  setVolume(volume: number): void;
  mute(muted: boolean): void;
  getTrackTitle(): string | null;
  /** Subscribe to state/track/error events; returns the unsubscribe. */
  onEvent(listener: SourceListener): () => void;
  /** Tear down (remove the embed, drop listeners). */
  destroy(): void;
}
