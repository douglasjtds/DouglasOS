import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EASTER_EGG_TOTAL, type EasterEggId } from "@/lib/easter-eggs/registry";
import {
  EMPTY_PROGRESS,
  countFound,
  discoverEgg,
  isComplete,
  sanitizeProgress,
  type Announcement,
  type EggProgress,
} from "@/lib/easter-eggs/progress";

/** localStorage key of the easter-egg progress (versioned, see `version`). */
export const EASTER_EGG_STORAGE_KEY = "douglasos:easter-eggs";

interface EasterEggState extends EggProgress {
  /**
   * Mark an egg as found. Idempotent; returns true only the first time.
   * Safe from anywhere — React or not, with or without the shell mounted:
   * `useEasterEggStore.getState().discover("run-cmd")`. The tray toast is
   * queued in `pending` and shown by the shell when it can (immediately on
   * the desktop, or the next time the desktop loads).
   */
  discover: (id: EasterEggId, now?: number) => boolean;
  /**
   * Drop the head of `pending` (its toast / the reward was delivered). With
   * `expected`, only if that is still the head — so a repeated call (a
   * re-run effect, a double click) can never skip the next announcement.
   */
  acknowledge: (expected?: Announcement) => void;
  /** "Reset progress": forget every egg (and any pending announcement). */
  reset: () => void;
}

/**
 * Easter-egg discovery counter (stage 11, DESKTOP-INTERFACE-SPEC → Easter
 * eggs). Persisted in localStorage — progress survives sessions, unlike the
 * assistant/messenger session flags — so the secret wallpaper stays unlocked.
 */
export const useEasterEggStore = create<EasterEggState>()(
  persist(
    (set, get) => ({
      ...EMPTY_PROGRESS,
      discover: (id, now = Date.now()) => {
        const { progress, isNew } = discoverEgg({ found: get().found, pending: get().pending }, id, now);
        if (isNew) set(progress);
        return isNew;
      },
      acknowledge: (expected) =>
        set((s) => {
          if (s.pending.length === 0 || (expected !== undefined && s.pending[0] !== expected)) return s;
          return { pending: s.pending.slice(1) };
        }),
      reset: () => set({ found: {}, pending: [] }),
    }),
    {
      name: EASTER_EGG_STORAGE_KEY,
      version: 1,
      partialize: (s): EggProgress => ({ found: s.found, pending: s.pending }),
      // A future version bump keeps whatever still makes sense.
      migrate: (persisted) => sanitizeProgress(persisted),
      // Unknown ids and corrupt values are dropped instead of breaking the count.
      merge: (persisted, current) => ({ ...current, ...sanitizeProgress(persisted) }),
    },
  ),
);

/** Selector: how many eggs were found. */
export function selectFoundCount(state: Pick<EggProgress, "found">): number {
  return countFound(state.found);
}

/** Selector: every egg found (the secret wallpaper is unlocked). */
export function selectComplete(state: Pick<EggProgress, "found">): boolean {
  return isComplete(state.found);
}

/** `{ count, total, complete }` for UI (Start menu counter, Achievements). */
export function useEasterEggProgress() {
  const count = useEasterEggStore(selectFoundCount);
  return { count, total: EASTER_EGG_TOTAL, complete: count === EASTER_EGG_TOTAL };
}
