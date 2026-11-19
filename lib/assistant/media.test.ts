import { describe, expect, it } from "vitest";
import { clipForState, clipSource, pickMediaFormat } from "@/lib/assistant/media";

const UA = {
  chromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  chromeIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1",
  android:
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
};

describe("pickMediaFormat", () => {
  it("gives VP9 WebM to Chromium and Firefox, even when they claim HEVC", () => {
    for (const userAgent of [UA.chromeMac, UA.firefox, UA.android]) {
      expect(pickMediaFormat({ userAgent, canPlayWebm: true, canPlayHevc: true })).toBe("webm");
    }
  });

  it("gives HEVC-with-alpha to Apple WebKit (Safari and every iOS browser)", () => {
    for (const userAgent of [UA.safariMac, UA.chromeIos]) {
      expect(pickMediaFormat({ userAgent, canPlayWebm: true, canPlayHevc: true })).toBe("hevc");
    }
  });

  it("falls back to the poster when the right format can't play", () => {
    expect(pickMediaFormat({ userAgent: UA.safariMac, canPlayWebm: true, canPlayHevc: false })).toBe("poster");
    expect(pickMediaFormat({ userAgent: UA.firefox, canPlayWebm: false, canPlayHevc: false })).toBe("poster");
  });
});

describe("clips", () => {
  it("maps each state to its clip and file", () => {
    expect(clipForState("idle")).toBe("idle");
    expect(clipForState("talking")).toBe("talk");
    expect(clipForState("dancing")).toBe("dance");
    expect(clipSource("dance", "webm")).toEqual({ src: "/assistant/dance.webm", type: 'video/webm; codecs="vp9"' });
    expect(clipSource("talk", "hevc")).toEqual({ src: "/assistant/talk.mov", type: 'video/mp4; codecs="hvc1"' });
  });
});
