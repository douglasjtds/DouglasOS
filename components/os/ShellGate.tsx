"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DesktopShell } from "@/components/os/DesktopShell";
import { MobilePlaceholder } from "@/components/os/MobilePlaceholder";

/**
 * Mounts the full OS shell only at >=768px; smaller viewports get a minimal
 * placeholder. While the media query resolves (null, pre-mount) we render a
 * neutral dark surface so the first client paint matches SSR.
 */
export function ShellGate() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop === null) {
    return <div className="min-h-dvh bg-base-0" aria-hidden />;
  }

  return isDesktop ? <DesktopShell /> : <MobilePlaceholder />;
}
