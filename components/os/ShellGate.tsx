"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DesktopShell } from "@/components/os/DesktopShell";
import { MobileFallback } from "@/components/os/MobileFallback";

/**
 * Mounts the full OS shell only at >=768px; smaller viewports get the linear
 * mobile fallback (until the touchable XP shell lands in stage 2). While the
 * media query resolves (null, pre-mount) we render the solid desktop color so
 * the first client paint matches SSR.
 */
export function ShellGate() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop === null) {
    return <div className="min-h-dvh bg-desktop" aria-hidden />;
  }

  return isDesktop ? <DesktopShell /> : <MobileFallback />;
}
