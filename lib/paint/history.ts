/**
 * Bounded undo/redo history for DouglasOS Paint (stage 10). Pure and generic:
 * the app stores canvas snapshots (`ImageData`), the tests store numbers.
 *
 * `present` is the state on screen. Every committed edit is pushed; the oldest
 * snapshots fall off once `limit` undo steps are kept, so memory stays bounded
 * (a 1024 × 768 snapshot is ~3 MB). Pushing after an undo drops the redo branch.
 */
export interface History<T> {
  /** Older states, oldest first. Never longer than `limit`. */
  past: readonly T[];
  present: T;
  /** States undone, the next redo first. */
  future: readonly T[];
  /** Maximum number of undo steps kept. */
  limit: number;
}

/** Undo steps Paint keeps (bounded memory, see above). */
export const PAINT_HISTORY_LIMIT = 20;

export function createHistory<T>(present: T, limit: number = PAINT_HISTORY_LIMIT): History<T> {
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`Invalid history limit: ${limit}`);
  return { past: [], present, future: [], limit };
}

/** Commit a new state: the current one becomes undoable, redo is cleared. */
export function pushHistory<T>(history: History<T>, next: T): History<T> {
  const past = [...history.past, history.present];
  return {
    ...history,
    past: past.length > history.limit ? past.slice(past.length - history.limit) : past,
    present: next,
    future: [],
  };
}

export function canUndo<T>(history: History<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
  return history.future.length > 0;
}

/** Step back one state (no-op when there's nothing to undo). */
export function undoHistory<T>(history: History<T>): History<T> {
  if (!canUndo(history)) return history;
  const previous = history.past[history.past.length - 1];
  return {
    ...history,
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

/** Re-apply the last undone state (no-op when there's nothing to redo). */
export function redoHistory<T>(history: History<T>): History<T> {
  if (!canRedo(history)) return history;
  const [next, ...rest] = history.future;
  return {
    ...history,
    past: [...history.past, history.present],
    present: next,
    future: rest,
  };
}
