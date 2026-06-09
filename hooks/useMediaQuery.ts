import { useSyncExternalStore } from "react";

/**
 * Tracks a media query via `useSyncExternalStore`. Returns `null` during SSR /
 * first hydration paint (so callers can render a neutral state), then the real
 * boolean — no hydration mismatch and no setState-in-effect.
 */
export function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}
