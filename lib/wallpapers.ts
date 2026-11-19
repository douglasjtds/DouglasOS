/**
 * Wallpaper catalog for Display Properties (DESIGN-GUIDELINES → Wallpapers).
 * Pure data + helpers; the choice itself lives in `displayStore`.
 */

export const WALLPAPER_IDS = [
  "morning-waves",
  "dusk-hills",
  "blueprint",
  "solid",
  "3d",
] as const;
export type WallpaperId = (typeof WALLPAPER_IDS)[number];

/** Static, original artwork served from `public/wallpapers/`. */
export const WALLPAPER_IMAGES: Partial<Record<WallpaperId, string>> = {
  "morning-waves": "/wallpapers/morning-waves.svg",
  "dusk-hills": "/wallpapers/dusk-hills.svg",
  blueprint: "/wallpapers/blueprint.svg",
};

/** Solid-color swatches — each maps to a `--color-swatch-*` token. */
export const SWATCH_IDS = ["navy", "teal", "forest", "plum", "slate"] as const;
export type SwatchId = (typeof SWATCH_IDS)[number];

export function swatchVar(id: SwatchId): string {
  return `var(--color-swatch-${id})`;
}

export interface DisplaySettings {
  wallpaper: WallpaperId;
  swatch: SwatchId;
}

export const DEFAULT_DISPLAY: DisplaySettings = {
  wallpaper: "morning-waves",
  swatch: "navy",
};

/** Why the animated (3D) wallpaper can't run here, or null when it can. */
export type AnimatedBlocker = "reducedMotion" | "saveData" | "mobile";

export function animatedWallpaperBlocker(env: {
  reducedMotion: boolean;
  saveData: boolean;
  mobile: boolean;
}): AnimatedBlocker | null {
  if (env.reducedMotion) return "reducedMotion";
  if (env.saveData) return "saveData";
  if (env.mobile) return "mobile";
  return null;
}

/**
 * The wallpaper actually painted: the 3D choice falls back to the default
 * static wallpaper whenever the animated one is unavailable.
 */
export function effectiveWallpaper(
  choice: WallpaperId,
  blocker: AnimatedBlocker | null,
): WallpaperId {
  if (choice === "3d" && blocker) return DEFAULT_DISPLAY.wallpaper;
  return choice;
}

/**
 * Coerce persisted/unknown input back into valid settings. Retired ids (e.g.
 * the stage-1 default "morning-hills", replaced by "morning-waves") are simply
 * unknown here, so an old saved choice falls back to the current default.
 */
export function sanitizeDisplay(input: unknown): DisplaySettings {
  const raw = (input ?? {}) as Partial<Record<keyof DisplaySettings, unknown>>;
  const wallpaper = WALLPAPER_IDS.includes(raw.wallpaper as WallpaperId)
    ? (raw.wallpaper as WallpaperId)
    : DEFAULT_DISPLAY.wallpaper;
  const swatch = SWATCH_IDS.includes(raw.swatch as SwatchId)
    ? (raw.swatch as SwatchId)
    : DEFAULT_DISPLAY.swatch;
  return { wallpaper, swatch };
}
