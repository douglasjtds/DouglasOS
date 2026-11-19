import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MOBILE_BREAKPOINT } from "@/lib/store/desktopGrid";

/** Media query for the full desktop shell (Tailwind `md`, 768px and up). */
export const DESKTOP_QUERY = `(min-width: ${MOBILE_BREAKPOINT}px)`;

/**
 * Whether the touch shell (< 768px, DESKTOP-INTERFACE-SPEC §11) is active.
 * `false` until the media query resolves; the shell itself only mounts after
 * that (see `ShellGate`), so components below it always get the real value.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(DESKTOP_QUERY) === false;
}
