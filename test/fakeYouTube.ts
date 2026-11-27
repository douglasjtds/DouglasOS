import type { YTNamespace, YTPlayer, YTPlayerOptions } from "@/lib/media/youtube";

/**
 * In-memory stand-in for the YouTube IFrame Player API (no network). Tests
 * drive it through `emitReady` / `emitState` / `emitError`; commands are
 * recorded in `calls`.
 */
export class FakePlayer implements YTPlayer {
  static instances: FakePlayer[] = [];
  calls: string[] = [];
  playlist: string[] = ["a", "b", "c"];
  index = 0;
  titles: Record<string, string> = { a: "Song A", b: "Song B", c: "Song C" };
  destroyed = false;

  constructor(
    public element: HTMLElement,
    public options: YTPlayerOptions,
  ) {
    FakePlayer.instances.push(this);
  }

  emitReady() {
    this.options.events?.onReady?.({ target: this });
  }
  emitState(data: number) {
    this.options.events?.onStateChange?.({ target: this, data });
  }
  emitError(data: number) {
    this.options.events?.onError?.({ target: this, data });
  }

  playVideo() {
    this.calls.push("play");
  }
  pauseVideo() {
    this.calls.push("pause");
  }
  stopVideo() {
    this.calls.push("stop");
  }
  nextVideo() {
    this.calls.push("next");
    this.index = Math.min(this.index + 1, this.playlist.length - 1);
  }
  previousVideo() {
    this.calls.push("prev");
    this.index = Math.max(this.index - 1, 0);
  }
  playVideoAt(index: number) {
    this.calls.push(`playAt:${index}`);
    this.index = index;
  }
  cuePlaylist({ index = 0 }: { list: string; listType: "playlist"; index?: number }) {
    this.calls.push(`cue:${index}`);
    this.index = index;
  }
  setVolume(volume: number) {
    this.calls.push(`volume:${volume}`);
  }
  mute() {
    this.calls.push("mute");
  }
  unMute() {
    this.calls.push("unmute");
  }
  getPlaylist() {
    return this.playlist;
  }
  getPlaylistIndex() {
    return this.index;
  }
  getVideoData() {
    return { title: this.titles[this.playlist[this.index]] };
  }
  destroy() {
    this.destroyed = true;
  }
}

export function createFakeYT(): YTNamespace {
  FakePlayer.instances = [];
  return { Player: FakePlayer, loaded: 1 };
}

export function lastPlayer(): FakePlayer {
  const player = FakePlayer.instances.at(-1);
  if (!player) throw new Error("No fake player created");
  return player;
}
