import type { PlaybackStatus } from "@/lib/store/playbackStore";

/**
 * Media Session API (lock screen / hardware keys / OS media overlay), where
 * the browser supports it. Limitation: the audio really plays inside the
 * YouTube iframe, and browsers usually attribute the session to that frame,
 * so YouTube's own metadata may win over ours and background playback still
 * stops when a phone locks (YouTube embed limitation).
 */
export interface MediaSessionHandlers {
  play: () => void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
}

function session(): MediaSession | null {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return null;
  return navigator.mediaSession;
}

const ACTIONS: [MediaSessionAction, keyof MediaSessionHandlers][] = [
  ["play", "play"],
  ["pause", "pause"],
  ["stop", "stop"],
  ["nexttrack", "next"],
  ["previoustrack", "prev"],
];

export function bindMediaSession(handlers: MediaSessionHandlers): () => void {
  const ms = session();
  if (!ms) return () => {};
  for (const [action, key] of ACTIONS) {
    try {
      ms.setActionHandler(action, () => handlers[key]());
    } catch {
      // Unsupported action in this browser.
    }
  }
  return () => {
    for (const [action] of ACTIONS) {
      try {
        ms.setActionHandler(action, null);
      } catch {
        // ignore
      }
    }
    ms.metadata = null;
    ms.playbackState = "none";
  };
}

export function updateMediaSession(title: string | null, status: PlaybackStatus, album: string): void {
  const ms = session();
  if (!ms) return;
  try {
    if (title && typeof MediaMetadata !== "undefined") {
      ms.metadata = new MediaMetadata({ title, artist: "YouTube", album });
    }
    ms.playbackState = status === "playing" ? "playing" : status === "paused" ? "paused" : "none";
  } catch {
    // Non-fatal.
  }
}
