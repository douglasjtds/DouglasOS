import { beforeEach, describe, expect, it } from "vitest";
import { useDisplayStore } from "@/lib/store/displayStore";
import {
  DEFAULT_DISPLAY,
  animatedWallpaperBlocker,
  effectiveWallpaper,
  sanitizeDisplay,
} from "@/lib/wallpapers";

const store = () => useDisplayStore.getState();

describe("displayStore", () => {
  beforeEach(() => store().resetDisplay());

  it("defaults to the Morning Waves wallpaper", () => {
    expect(store().wallpaper).toBe("morning-waves");
    expect(store().swatch).toBe(DEFAULT_DISPLAY.swatch);
  });

  it("applies a wallpaper + swatch selection and persists it", () => {
    store().applyDisplay({ wallpaper: "solid", swatch: "teal" });
    expect(store().wallpaper).toBe("solid");
    expect(store().swatch).toBe("teal");
    const saved = JSON.parse(localStorage.getItem("douglasos:display")!);
    expect(saved.state).toEqual({ wallpaper: "solid", swatch: "teal" });
  });

  it("rehydrates a saved choice and ignores corrupt values", async () => {
    localStorage.setItem(
      "douglasos:display",
      JSON.stringify({ state: { wallpaper: "dusk-hills", swatch: "nope" }, version: 1 }),
    );
    await useDisplayStore.persist.rehydrate();
    expect(store().wallpaper).toBe("dusk-hills");
    expect(store().swatch).toBe(DEFAULT_DISPLAY.swatch);
  });

  it("falls back to the default when a retired wallpaper id was persisted", async () => {
    localStorage.setItem(
      "douglasos:display",
      JSON.stringify({ state: { wallpaper: "morning-hills", swatch: "teal" }, version: 1 }),
    );
    await useDisplayStore.persist.rehydrate();
    expect(store().wallpaper).toBe(DEFAULT_DISPLAY.wallpaper);
    expect(store().swatch).toBe("teal");
  });
});

describe("wallpaper helpers", () => {
  it("sanitizeDisplay falls back to defaults for unknown input", () => {
    expect(sanitizeDisplay(null)).toEqual(DEFAULT_DISPLAY);
    expect(sanitizeDisplay({ wallpaper: "not-a-wallpaper" })).toEqual(DEFAULT_DISPLAY);
  });

  it("reports why the animated wallpaper is unavailable", () => {
    const env = { reducedMotion: false, saveData: false, mobile: false };
    expect(animatedWallpaperBlocker(env)).toBeNull();
    expect(animatedWallpaperBlocker({ ...env, reducedMotion: true })).toBe("reducedMotion");
    expect(animatedWallpaperBlocker({ ...env, saveData: true })).toBe("saveData");
    expect(animatedWallpaperBlocker({ ...env, mobile: true })).toBe("mobile");
  });

  it("falls back to the default static wallpaper when 3D is blocked", () => {
    expect(effectiveWallpaper("3d", null)).toBe("3d");
    expect(effectiveWallpaper("3d", "reducedMotion")).toBe("morning-waves");
    expect(effectiveWallpaper("blueprint", "reducedMotion")).toBe("blueprint");
    // Stage 11: the secret wallpaper paints only once every egg was found.
    expect(effectiveWallpaper("golden-egg", null)).toBe("morning-waves");
    expect(effectiveWallpaper("golden-egg", null, false)).toBe("morning-waves");
    expect(effectiveWallpaper("golden-egg", null, true)).toBe("golden-egg");
  });
});
