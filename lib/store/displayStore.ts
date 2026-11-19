import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_DISPLAY,
  sanitizeDisplay,
  type DisplaySettings,
} from "@/lib/wallpapers";

interface DisplayState extends DisplaySettings {
  /** Apply a full selection from Display Properties (Apply / OK). */
  applyDisplay: (settings: DisplaySettings) => void;
  /** Back to the default wallpaper. */
  resetDisplay: () => void;
}

/** The desktop wallpaper choice, persisted locally (`douglasos:display`). */
export const useDisplayStore = create<DisplayState>()(
  persist(
    (set) => ({
      ...DEFAULT_DISPLAY,
      applyDisplay: (settings) => set(sanitizeDisplay(settings)),
      resetDisplay: () => set({ ...DEFAULT_DISPLAY }),
    }),
    {
      name: "douglasos:display",
      version: 1,
      partialize: (s): DisplaySettings => ({
        wallpaper: s.wallpaper,
        swatch: s.swatch,
      }),
      // Unknown/corrupt values fall back to defaults instead of breaking paint.
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeDisplay(persisted),
      }),
    },
  ),
);
