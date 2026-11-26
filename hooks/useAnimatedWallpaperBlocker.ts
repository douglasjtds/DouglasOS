import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { animatedWallpaperBlocker, type AnimatedBlocker } from "@/lib/wallpapers";

interface NetworkInformationLike {
  saveData?: boolean;
}

function prefersSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike })
    .connection;
  return Boolean(connection?.saveData);
}

/**
 * Why the animated "DouglasOS 3D" wallpaper can't run on this device right
 * now (reduced motion, Save-Data, mobile width), or null when it can.
 */
export function useAnimatedWallpaperBlocker(): AnimatedBlocker | null {
  const reducedMotion = useReducedMotion();
  const mobile = useIsMobile();
  return animatedWallpaperBlocker({
    reducedMotion,
    saveData: prefersSaveData(),
    mobile,
  });
}
