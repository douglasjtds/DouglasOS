import { EASTER_EGG_IDS, EASTER_EGG_TOTAL, isEasterEggId, type EasterEggId } from "@/lib/easter-eggs/registry";

/**
 * Pure easter-egg progress logic (stage 11). The store
 * (`lib/store/easterEggStore.ts`) is a thin persisted wrapper around these.
 */

/** When each egg was found (epoch ms). Missing key = not found yet. */
export type FoundMap = Partial<Record<EasterEggId, number>>;

/**
 * Something the shell still has to announce: an egg's tray toast, or the
 * "all found" reward. Kept in the persisted progress so a discovery made
 * where there's no shell (the real 404 page) is announced the next time the
 * desktop loads.
 */
export type Announcement = EasterEggId | "complete";

export interface EggProgress {
  found: FoundMap;
  pending: Announcement[];
}

export const EMPTY_PROGRESS: EggProgress = { found: {}, pending: [] };

export function countFound(found: FoundMap): number {
  return EASTER_EGG_IDS.filter((id) => found[id] !== undefined).length;
}

export function isComplete(found: FoundMap): boolean {
  return countFound(found) === EASTER_EGG_TOTAL;
}

/**
 * Record `id` as found at `now`. Idempotent: an egg already found (or an
 * unknown id from an untyped caller) leaves the progress untouched and
 * returns `isNew: false`. The egg's toast is queued, and when it was the
 * last one missing the reward is queued right after it.
 */
export function discoverEgg(progress: EggProgress, id: string, now: number): { progress: EggProgress; isNew: boolean } {
  if (!isEasterEggId(id) || progress.found[id] !== undefined) return { progress, isNew: false };
  const found: FoundMap = { ...progress.found, [id]: now };
  const pending: Announcement[] = [...progress.pending, id];
  if (isComplete(found) && !pending.includes("complete")) pending.push("complete");
  return { progress: { found, pending }, isNew: true };
}

/**
 * The toast's "(n/14)": how many eggs had been found when `id` was — so a
 * toast shown late (queued behind another balloon, or after the 404 page)
 * still reads the number it earned. Ties keep registry order.
 */
export function discoveryOrdinal(found: FoundMap, id: EasterEggId): number {
  const at = found[id];
  if (at === undefined) return countFound(found);
  const index = EASTER_EGG_IDS.indexOf(id);
  return EASTER_EGG_IDS.filter((other, i) => {
    const t = found[other];
    return t !== undefined && (t < at || (t === at && i <= index));
  }).length;
}

/**
 * Coerce persisted/unknown input into valid progress: unknown ids (an egg
 * that no longer exists, a typo, tampering) and bad timestamps are dropped,
 * pending entries must point at a found egg, duplicates collapse, and the
 * reward stays queued only while every egg is found.
 */
export function sanitizeProgress(input: unknown): EggProgress {
  const raw = (input ?? {}) as { found?: unknown; pending?: unknown };
  const found: FoundMap = {};
  if (raw.found && typeof raw.found === "object") {
    for (const [id, at] of Object.entries(raw.found as Record<string, unknown>)) {
      if (isEasterEggId(id) && typeof at === "number" && Number.isFinite(at) && at > 0) found[id] = at;
    }
  }
  const pending: Announcement[] = [];
  if (Array.isArray(raw.pending)) {
    for (const entry of raw.pending) {
      const valid = entry === "complete" ? isComplete(found) : isEasterEggId(entry) && found[entry] !== undefined;
      if (valid && !pending.includes(entry as Announcement)) pending.push(entry as Announcement);
    }
  }
  return { found, pending };
}
