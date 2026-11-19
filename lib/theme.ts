/**
 * Hex mirrors of a few color tokens for places that can't read CSS variables:
 * the `theme-color` meta, the generated OG image and app icons. Keep in sync
 * with the @theme block in app/globals.css (DESIGN-GUIDELINES.md → Color Palette).
 */
export const THEME_HEX = {
  taskbar: "#245ddb",
  taskbarHighlight: "#3f8cf3",
  taskbarShadow: "#1941a5",
  titlebar: "#0058ee",
  titlebarHighlight: "#3d95ff",
  start: "#2e7d32",
  startHighlight: "#5db85d",
  desktop: "#004e98",
  logonBg: "#5a7edc",
  logonBand: "#00309c",
  logonDivider: "#f5a86c",
  buttonFace: "#ece9d8",
  surface: "#ffffff",
  text: "#000000",
  textInverse: "#ffffff",
} as const;
