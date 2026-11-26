/**
 * Where DouglasOS Media Player gets its music (DESKTOP-INTERFACE-SPEC → Media
 * Player). One constant to swap: a public, embeddable YouTube playlist played
 * through the official IFrame Player API.
 *
 * Note: this is a third-party playlist — its owner may reorder it, remove
 * videos, disable embedding or delete it at any time. Unplayable videos are
 * skipped automatically; if none plays, the player offers to open the
 * playlist on YouTube.
 */
export const YOUTUBE_PLAYLIST_ID = "PLdw3FCGShY-U";

/** Privacy-enhanced embed host (no cookies until the visitor plays a video). */
export const YOUTUBE_EMBED_HOST = "https://www.youtube-nocookie.com";

/**
 * The IFrame Player API bootstrap script. Only injected when the player
 * window mounts — never on the initial page load.
 */
export const YOUTUBE_IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

/** Public playlist page (the "Open on YouTube" fallback). */
export function youtubePlaylistUrl(playlistId: string = YOUTUBE_PLAYLIST_ID): string {
  return `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
}
