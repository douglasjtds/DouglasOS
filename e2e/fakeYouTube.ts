import type { Page } from "@playwright/test";

/**
 * A fake YouTube IFrame Player API served in place of
 * https://www.youtube.com/iframe_api, so the media-player specs never hit
 * the network. It draws a ≥200×200 "screen" where the real iframe would go
 * and simulates states (buffering → playing, paused, cued) asynchronously.
 * `window.__fakeYtFailAll = true` (set before load) makes every video fail
 * with error 150 (embedding disabled). \`window.__fakeYtCueIndex\` pins the
 * track the player's random start re-cue lands on (predictable titles).
 */
const FAKE_IFRAME_API = `
(function () {
  var STATES = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
  function Player(el, opts) {
    var self = this;
    this.opts = opts;
    this.index = 0;
    this.playlist = ["v1", "v2", "v3"];
    this.titles = ["Fake Track One", "Fake Track Two", "Fake Track Three"];
    this.volume = 100;
    this.muted = false;
    var screen = document.createElement("div");
    screen.setAttribute("data-fake-youtube", "");
    screen.style.cssText = "width:100%;height:100%;min-width:200px;min-height:200px;display:flex;align-items:center;justify-content:center;color:#fff;font:bold 16px Tahoma;background:linear-gradient(135deg,#1b2f5e,#5a2a7a)";
    screen.textContent = "Fake YouTube player";
    el.replaceWith(screen);
    window.__fakeYt = self;
    setTimeout(function () { opts.events && opts.events.onReady && opts.events.onReady({ target: self }); }, 50);
  }
  // Like the real player, a new command supersedes what an earlier one had
  // scheduled (Stop right after Next must not be followed by Next's PLAYING).
  Player.prototype._later = function (fn, ms) {
    var self = this;
    var gen = self._gen;
    setTimeout(function () { if (self._gen === gen) fn(); }, ms);
  };
  Player.prototype._command = function () { this._gen = (this._gen || 0) + 1; };
  Player.prototype._state = function (data) {
    var self = this;
    var cb = this.opts.events && this.opts.events.onStateChange;
    if (cb) cb({ target: self, data: data });
  };
  Player.prototype._start = function () {
    var self = this;
    self._command();
    if (window.__fakeYtFailAll) {
      self._later(function () { self.opts.events.onError({ target: self, data: 150 }); }, 30);
      return;
    }
    self._later(function () { self._state(STATES.BUFFERING); }, 20);
    self._later(function () { self._state(STATES.PLAYING); }, 60);
  };
  Player.prototype.playVideo = function () { this._start(); };
  Player.prototype.pauseVideo = function () { var s = this; s._command(); s._later(function () { s._state(STATES.PAUSED); }, 20); };
  Player.prototype.stopVideo = function () { var s = this; s._command(); s._later(function () { s._state(STATES.CUED); }, 20); };
  Player.prototype.nextVideo = function () { this.index = Math.min(this.index + 1, 2); this._start(); };
  Player.prototype.previousVideo = function () { this.index = Math.max(this.index - 1, 0); this._start(); };
  Player.prototype.playVideoAt = function (i) { this.index = i; this._start(); };
  Player.prototype.cuePlaylist = function (args) {
    var s = this;
    var pinned = window.__fakeYtCueIndex;
    this.index = typeof pinned === "number" ? pinned : (args && args.index) || 0;
    s._command();
    s._later(function () { s._state(STATES.CUED); }, 20);
  };
  Player.prototype.setVolume = function (v) { this.volume = v; };
  Player.prototype.mute = function () { this.muted = true; };
  Player.prototype.unMute = function () { this.muted = false; };
  Player.prototype.getPlaylist = function () { return this.playlist; };
  Player.prototype.getPlaylistIndex = function () { return this.index; };
  Player.prototype.getVideoData = function () { return { title: this.titles[this.index] }; };
  Player.prototype.destroy = function () {};
  window.YT = { Player: Player, PlayerState: STATES, loaded: 1 };
  if (typeof window.onYouTubeIframeAPIReady === "function") window.onYouTubeIframeAPIReady();
})();
`;

/**
 * Serve the fake API and block every other YouTube request. Returns the list
 * of YouTube URLs the page asked for (to check nothing loads before the
 * player window opens).
 */
export async function mockYouTube(
  page: Page,
  { failAll = false, cueIndex }: { failAll?: boolean; cueIndex?: number } = {},
) {
  const requested: string[] = [];
  if (cueIndex !== undefined) {
    await page.addInitScript((index) => {
      (window as unknown as { __fakeYtCueIndex: number }).__fakeYtCueIndex = index;
    }, cueIndex);
  }
  if (failAll) {
    await page.addInitScript(() => {
      (window as unknown as { __fakeYtFailAll: boolean }).__fakeYtFailAll = true;
    });
  }
  // Context-wide, so a popup ("Open on YouTube") can't reach the network either.
  await page.context().route(/youtube(-nocookie)?\.com|ytimg\.com|googlevideo\.com/, (route) => {
    const url = route.request().url();
    requested.push(url);
    if (url.startsWith("https://www.youtube.com/iframe_api")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_IFRAME_API });
    }
    if (url.startsWith("https://www.youtube.com/playlist")) {
      return route.fulfill({ status: 200, contentType: "text/html", body: "<p>playlist stub</p>" });
    }
    return route.abort();
  });
  return requested;
}
