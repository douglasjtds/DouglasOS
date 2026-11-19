"use client";

import { useDisplayStore } from "@/lib/store/displayStore";
import { useAnimatedWallpaperBlocker } from "@/hooks/useAnimatedWallpaperBlocker";
import { AmbientBackground } from "@/components/os/desktop/AmbientBackground";
import { SCENE_COLORS } from "@/components/os/desktop/sceneColors";
import { WALLPAPER_IMAGES, effectiveWallpaper, swatchVar } from "@/lib/wallpapers";

/**
 * Desktop background. The solid `desktop` color paints first; static art is a
 * CSS background (never an <img>, so it can't become the LCP element), and the
 * optional 3D scene lazy-loads on top only when it's allowed to run.
 */
export function Wallpaper() {
  const wallpaper = useDisplayStore((s) => s.wallpaper);
  const swatch = useDisplayStore((s) => s.swatch);
  const blocker = useAnimatedWallpaperBlocker();
  const effective = effectiveWallpaper(wallpaper, blocker);
  const image = WALLPAPER_IMAGES[effective];

  const backgroundColor =
    effective === "solid"
      ? swatchVar(swatch)
      : effective === "3d"
        ? SCENE_COLORS.base
        : "var(--color-desktop)";

  return (
    <div
      aria-hidden
      data-wallpaper={effective}
      className="pointer-events-none absolute inset-0 bg-cover bg-bottom bg-no-repeat"
      style={{
        backgroundColor,
        backgroundImage: image ? `url(${image})` : undefined,
      }}
    >
      {effective === "3d" && <AmbientBackground />}
    </div>
  );
}
