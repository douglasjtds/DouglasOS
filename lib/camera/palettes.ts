/**
 * Retro Cam palettes (stage 9, DESKTOP-INTERFACE-SPEC → Retro Cam).
 *
 * Every palette is a short list of RGB colors; the pixelation pipeline
 * (`lib/camera/pixelate.ts`) snaps each block to the nearest one. "Original"
 * has no list: the blocks keep their own averaged color.
 */

export type Rgb = readonly [number, number, number];

export type PaletteId = "douglasos" | "classic16" | "cga" | "original";

/** Order shown in the Palette dropdown (DouglasOS first, Original last). */
export const PALETTE_IDS: readonly PaletteId[] = ["douglasos", "classic16", "cga", "original"];

export const DEFAULT_PALETTE: PaletteId = "douglasos";

/** Parse `#rrggbb` into an RGB triple. */
export function hexToRgb(hex: string): Rgb {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Not a #rrggbb color: ${hex}`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/**
 * The "DouglasOS" palette: Luna color tokens from `app/globals.css`
 * (DESIGN-GUIDELINES → Color Palette), keyed by token name. The hex values are
 * a mirror (canvas code can't read CSS variables in a worker-free hot loop);
 * `palettes.test.ts` parses `globals.css` and fails if any value drifts from
 * its token. Chosen to cover darks, lights, the Luna blues, the Start greens
 * and the warm amber/peach tones that keep skin readable.
 */
export const DOUGLASOS_PALETTE_TOKENS = {
  "color-text": "#000000",
  "color-bevel-dark": "#716f64",
  "color-bevel-shadow": "#aca899",
  "color-button-face": "#ece9d8",
  "color-surface": "#ffffff",
  "color-taskbar-edge": "#0c37a8",
  "color-desktop": "#004e98",
  "color-titlebar": "#0058ee",
  "color-titlebar-highlight": "#3d95ff",
  "color-startmenu-right": "#d3e5fa",
  "color-start-shadow": "#1e5e22",
  "color-start-highlight": "#5db85d",
  "color-close-pressed": "#a93212",
  "color-close": "#d8461f",
  "color-hot": "#f8b330",
  "color-logon-divider": "#f5a86c",
} as const;

/** Classic 16-color text-mode/VGA palette (generic, public-domain values). */
const CLASSIC_16 = [
  "#000000",
  "#000080",
  "#008000",
  "#008080",
  "#800000",
  "#800080",
  "#808000",
  "#c0c0c0",
  "#808080",
  "#0000ff",
  "#00ff00",
  "#00ffff",
  "#ff0000",
  "#ff00ff",
  "#ffff00",
  "#ffffff",
];

/** CGA-style 4 colors: black, cyan, magenta, white (high-intensity palette 1). */
const CGA = ["#000000", "#55ffff", "#ff55ff", "#ffffff"];

export const PALETTES: Record<PaletteId, readonly Rgb[] | null> = {
  douglasos: Object.values(DOUGLASOS_PALETTE_TOKENS).map(hexToRgb),
  classic16: CLASSIC_16.map(hexToRgb),
  cga: CGA.map(hexToRgb),
  original: null,
};

export function isPaletteId(value: string): value is PaletteId {
  return (PALETTE_IDS as readonly string[]).includes(value);
}
