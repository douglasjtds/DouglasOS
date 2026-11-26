import { create } from "zustand";

/**
 * The single balloon slot (DESKTOP-INTERFACE-SPEC → Layering). Everything
 * that pops up near the tray — the welcome balloon, the mini Douglas bubble
 * from stage 5b, the Messenger toast and, from stage 6, the Recycle Bin's
 * rescue balloon (when mini Douglas was dismissed) — asks for the slot and shows only
 * while it holds it, so two of them are never on screen at once. First come,
 * first served; releasing hands the slot to the next owner in line.
 */
export type BalloonOwner = "welcome" | "assistant" | "messenger" | "recycleBin" | "easterEgg";

/** Add `owner` to the end of the line (no-op if already waiting or showing). */
export function enqueueBalloon(queue: readonly BalloonOwner[], owner: BalloonOwner): readonly BalloonOwner[] {
  return queue.includes(owner) ? queue : [...queue, owner];
}

/** Remove `owner` from the line (no-op if absent). */
export function dequeueBalloon(queue: readonly BalloonOwner[], owner: BalloonOwner): readonly BalloonOwner[] {
  return queue.includes(owner) ? queue.filter((o) => o !== owner) : queue;
}

interface BalloonState {
  /** Owners in line; the head is the one on screen. */
  queue: readonly BalloonOwner[];
  request: (owner: BalloonOwner) => void;
  release: (owner: BalloonOwner) => void;
}

export const useBalloonStore = create<BalloonState>()((set) => ({
  queue: [],
  request: (owner) => set((s) => ({ queue: enqueueBalloon(s.queue, owner) })),
  release: (owner) => set((s) => ({ queue: dequeueBalloon(s.queue, owner) })),
}));

/** Selector: who holds the slot right now (null = free). */
export function selectActiveBalloon(state: Pick<BalloonState, "queue">): BalloonOwner | null {
  return state.queue[0] ?? null;
}
