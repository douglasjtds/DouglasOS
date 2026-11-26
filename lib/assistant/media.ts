import type { AssistantState } from "@/lib/store/assistantStore";

/**
 * Character asset contract (instructions/full-refactor/ASSISTANT-ASSETS.md).
 *
 * Files in `public/assistant/`:
 * - `idle.webm`, `talk.webm`, `dance.webm` — VP9 with alpha (Chromium, Firefox);
 * - `idle.mov`, `talk.mov`, `dance.mov` — HEVC with alpha (Safari / every iOS
 *   browser, which don't render VP9 alpha);
 * - `poster.png` — transparent still: first paint, reduced motion, and the
 *   last-resort fallback when no video format plays or a video errors.
 *
 * Until Douglas records them, `ready` stays false and an original SVG
 * placeholder renders behind the same `AssistantCharacter` interface. Flip it
 * to true once all seven files are in place — nothing else changes.
 */
export const ASSISTANT_MEDIA = {
  ready: false,
  basePath: "/assistant",
  poster: "/assistant/poster.png",
} as const;

/** One looping clip per assistant state. */
export type CharacterClip = "idle" | "talk" | "dance";

export function clipForState(state: AssistantState): CharacterClip {
  if (state === "dancing") return "dance";
  return state === "talking" ? "talk" : "idle";
}

/** Which encoding this browser gets. */
export type MediaFormat = "webm" | "hevc" | "poster";

export interface MediaEnvironment {
  userAgent: string;
  /** `video.canPlayType('video/webm; codecs="vp9"')` is non-empty. */
  canPlayWebm: boolean;
  /** `video.canPlayType('video/mp4; codecs="hvc1"')` is non-empty. */
  canPlayHevc: boolean;
}

/**
 * Apple's WebKit (Safari on macOS, every browser on iOS/iPadOS) plays VP9 but
 * drops its alpha channel (the character would get a black box), so it gets
 * the HEVC-with-alpha file instead. Everyone else gets VP9 WebM. Picked in JS
 * rather than by `<source>` order because Chromium on macOS may also claim
 * HEVC support yet ignore HEVC alpha.
 */
export function pickMediaFormat(env: MediaEnvironment): MediaFormat {
  const ua = env.userAgent;
  const iOS = /iPhone|iPad|iPod/.test(ua);
  const desktopSafari = /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS|Android/.test(ua);
  if ((iOS || desktopSafari) && env.canPlayHevc) return "hevc";
  if (!iOS && !desktopSafari && env.canPlayWebm) return "webm";
  return "poster";
}

/** URL + MIME type of a clip in a format. */
export function clipSource(clip: CharacterClip, format: Exclude<MediaFormat, "poster">) {
  return format === "webm"
    ? { src: `${ASSISTANT_MEDIA.basePath}/${clip}.webm`, type: 'video/webm; codecs="vp9"' }
    : { src: `${ASSISTANT_MEDIA.basePath}/${clip}.mov`, type: 'video/mp4; codecs="hvc1"' };
}
