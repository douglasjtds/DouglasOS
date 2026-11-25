import { useSyncExternalStore } from "react";
import type { Viewport } from "@/lib/store/geometry";
import { FALLBACK_VIEWPORT } from "@/lib/store/desktopGrid";

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

const width = () => window.innerWidth;
const height = () => window.innerHeight;

/** The live window size (re-renders on resize); the desktop default on the server. */
export function useViewport(): Viewport {
  const w = useSyncExternalStore(subscribeResize, width, () => FALLBACK_VIEWPORT.width);
  const h = useSyncExternalStore(subscribeResize, height, () => FALLBACK_VIEWPORT.height);
  return { width: w, height: h };
}
