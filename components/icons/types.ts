import { useId, type ComponentType } from "react";

/**
 * Props shared by every DouglasOS icon. Icons are drawn on a 48×48 master
 * canvas and scale to 32/24/16px through `size`.
 */
export interface IconProps {
  /** Rendered width/height in px (default 48). */
  size?: number;
  className?: string;
}

export type IconComponent = ComponentType<IconProps>;

/**
 * Unique, SSR-stable ids for an icon's SVG gradients/filters, so several
 * instances on the page never share (and clobber) a `<linearGradient>` id.
 */
export function useSvgIds<const K extends string>(...keys: K[]): Record<K, string> {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = {} as Record<K, string>;
  for (const key of keys) ids[key] = `${base}-${key}`;
  return ids;
}

/**
 * Icon-local accent colors (DESIGN-GUIDELINES → Iconography allows a small
 * documented set beyond the UI tokens). Shared so icons stay consistent.
 */
export const ICON_COLORS = {
  outline: "#1d3f7a",
  shadow: "#000000",
  paper: "#ffffff",
  paperShade: "#dde4ef",
  paperLine: "#9aa8bf",
  blueLight: "#5aa2ff",
  blue: "#245ddb",
  blueDark: "#123c9c",
  greenLight: "#7ed36f",
  green: "#2e8b2e",
  greenDark: "#1e5e22",
  yellowLight: "#ffe58a",
  yellow: "#f2c230",
  yellowDark: "#c08a12",
  orange: "#e5813a",
  redLight: "#f08a6c",
  red: "#d8461f",
  redDark: "#8f2a10",
  leatherLight: "#c98a4b",
  leather: "#8a5424",
  leatherDark: "#5c3514",
  metalLight: "#f1f3f7",
  metal: "#b7bcc8",
  metalDark: "#6f7686",
  beigeLight: "#f4f2ea",
  beige: "#c9c5b4",
  beigeDark: "#8d8977",
} as const;
