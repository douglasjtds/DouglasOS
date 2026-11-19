/**
 * Motion tokens (DESIGN-GUIDELINES.md → Motion). Framer Motion consumes TS
 * values, so the tokens live here. Durations are in seconds (Framer's unit).
 */
export const DURATION = {
  instant: 0,
  fast: 0.1,
  base: 0.15,
  slow: 0.25,
} as const;

export const EASE = {
  out: [0.2, 0, 0, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  linear: "linear" as const,
};

/** Boot progress marquee loop length (seconds). */
export const BOOT_MARQUEE_S = 1.2;
