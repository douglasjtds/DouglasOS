import { create } from "zustand";

/**
 * The single balloon slot (DESKTOP-INTERFACE-SPEC → Layering). Everything
 * that pops up near the tray — the welcome balloon, the mini Douglas bubble
 * from stage 5b, the Messenger toast and, from stage 6, the Recycle Bin's
 * rescue balloon (when mini Douglas was dismissed) and, from stage 11, the
 * easter-egg toast — asks for the slot and shows only while it holds it, so
 * two of them are never on screen at once. First come, first served;
 * releasing hands the slot to the next owner in line.
 *
 * Exception (stage 11): the easter-egg toast **yields**. It's a by-product of
 * something the visitor just did, whose own reaction (the rescue line, mini
 * Douglas's bubble…) must land first, so any other owner goes ahead of it —
 * even while it's on screen (it hides and comes back, timer restarted, once
 * the slot frees up).
 */
export type BalloonOwner =
  | "welcome"
  | "assistant"
  | "messenger"
  | "recycleBin"
  /** DON'T OPEN THIS.exe's runaway-desktop balloon (stage 10): a regular owner. */
  | "dontOpenThis"
  /** The easter-egg discovery toast (stage 11): always yields. */
  | "easterEgg";

/** Owners that let every other owner go first (see above). */
const YIELDING_OWNERS: readonly BalloonOwner[] = ["easterEgg"];

/**
 * Add `owner` to the line (no-op if already waiting or showing): at the end,
 * except that a regular owner goes ahead of the yielding ones.
 */
export function enqueueBalloon(queue: readonly BalloonOwner[], owner: BalloonOwner): readonly BalloonOwner[] {
  if (queue.includes(owner)) return queue;
  const firstYielding = YIELDING_OWNERS.includes(owner) ? -1 : queue.findIndex((o) => YIELDING_OWNERS.includes(o));
  if (firstYielding === -1) return [...queue, owner];
  return [...queue.slice(0, firstYielding), owner, ...queue.slice(firstYielding)];
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
