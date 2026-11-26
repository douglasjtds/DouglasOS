import { create } from "zustand";
import { takeNextEgg, type EasterEggId } from "@/lib/easterEgg";
import { useEasterEggStore } from "@/lib/store/easterEggStore";
import type { EasterEggId as DiscoveryId } from "@/lib/easter-eggs/registry";

/** Each DON'T OPEN THIS egg's id in the discovery counter (stage 11). */
export const EGG_DISCOVERY: Record<EasterEggId, DiscoveryId> = {
  "not-found": "egg-404",
  scramble: "egg-runaway",
  "access-denied": "egg-scold",
};

/**
 * Which "DON'T OPEN THIS.exe" easter egg is playing (stage 10). In memory
 * only; the per-session cycle count lives in sessionStorage
 * (`EASTER_EGG_STORAGE_KEY`). `seq` changes on every open so the layer
 * remounts the egg from the start.
 */
interface EasterEggState {
  active: EasterEggId | null;
  seq: number;
  /** Play the next egg of the cycle (ignored while one is already playing). */
  open: () => void;
  /** Play a specific egg (tests, screenshots). */
  play: (egg: EasterEggId) => void;
  close: () => void;
}

function sessionStore(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export const useDontOpenThisStore = create<EasterEggState>()((set, get) => ({
  active: null,
  seq: 0,
  open: () => {
    if (get().active) return;
    get().play(takeNextEgg(sessionStore()));
  },
  play: (egg) => {
    set((s) => ({ active: egg, seq: s.seq + 1 }));
    useEasterEggStore.getState().discover(EGG_DISCOVERY[egg]);
  },
  close: () => set({ active: null }),
}));
