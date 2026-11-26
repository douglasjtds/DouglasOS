import { create } from "zustand";
import { takeNextEgg, type EasterEggId } from "@/lib/easterEgg";

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

export const useEasterEggStore = create<EasterEggState>()((set, get) => ({
  active: null,
  seq: 0,
  open: () => {
    if (get().active) return;
    get().play(takeNextEgg(sessionStore()));
  },
  play: (egg) => set((s) => ({ active: egg, seq: s.seq + 1 })),
  close: () => set({ active: null }),
}));
