"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DESKTOP_QUERY } from "@/hooks/useIsMobile";
import { DesktopShell } from "@/components/os/DesktopShell";
import { DEFAULT_DISPLAY, WALLPAPER_IMAGES } from "@/lib/wallpapers";

/** Painted by the server HTML, before any JS (see the LCP note below). */
const PLACEHOLDER_WALLPAPER = WALLPAPER_IMAGES[DEFAULT_DISPLAY.wallpaper];

/**
 * Mounts the DouglasOS shell on the client. Every width gets the same shell:
 * ≥ 768px the pointer desktop, below that the touchable variant
 * (DESKTOP-INTERFACE-SPEC §11) — components read `useIsMobile()` to adapt.
 * While the media query resolves (null: SSR / first paint) we render the
 * desktop color + the default wallpaper so the first client paint matches the
 * server HTML. Painting the wallpaper from the server HTML matters for LCP:
 * CSS background images count as LCP candidates, and the full-screen
 * wallpaper would otherwise only appear after hydration (measured ~2.8s on
 * Lighthouse mobile vs ~1s this way). Visitors who picked another wallpaper
 * see the default only until hydration. The
 * crawlable text version of the content is rendered next to this by the page
 * (`StaticContent`), so nothing depends on this placeholder.
 */
export function ShellGate() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  if (isDesktop === null) {
    return (
      <div data-shell-placeholder aria-hidden className="relative h-dvh bg-desktop">
        {/* Same box as the shell's wallpaper (the work area above the
            taskbar): Chrome ignores full-viewport background images as LCP
            candidates, and an identical box keeps the post-hydration
            wallpaper from becoming a "larger" late candidate. */}
        <div
          className="absolute inset-x-0 top-0 bottom-taskbar bg-cover bg-bottom bg-no-repeat"
          style={{ backgroundImage: `url(${PLACEHOLDER_WALLPAPER})` }}
        />
      </div>
    );
  }

  return <DesktopShell />;
}
