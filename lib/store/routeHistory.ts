/**
 * Per-window navigation history (Back / Forward), pure and immutable. Used by
 * `windowStore` for apps that declare `routes` in the registry (today: the
 * DouglasOS Explorer in `projects`). Routes are opaque strings to this module;
 * the app decides what is valid.
 */

export interface RouteHistory {
  /** Visited routes, oldest first. Never empty. */
  entries: string[];
  /** Index of the current route in `entries`. */
  index: number;
}

/** Oldest entries are dropped beyond this (keeps localStorage small). */
export const HISTORY_LIMIT = 50;

export function createHistory(route: string): RouteHistory {
  return { entries: [route], index: 0 };
}

export function currentRoute(history: RouteHistory): string {
  return history.entries[history.index];
}

export function canGoBack(history: RouteHistory): boolean {
  return history.index > 0;
}

export function canGoForward(history: RouteHistory): boolean {
  return history.index < history.entries.length - 1;
}

/**
 * Navigate to `route`: drops the forward stack and appends it. Navigating to
 * the current route is a no-op (same object back), like a browser reload.
 */
export function pushRoute(history: RouteHistory, route: string): RouteHistory {
  if (currentRoute(history) === route) return history;
  const entries = [...history.entries.slice(0, history.index + 1), route];
  const overflow = Math.max(0, entries.length - HISTORY_LIMIT);
  const kept = entries.slice(overflow);
  return { entries: kept, index: kept.length - 1 };
}

export function goBack(history: RouteHistory): RouteHistory {
  return canGoBack(history) ? { ...history, index: history.index - 1 } : history;
}

export function goForward(history: RouteHistory): RouteHistory {
  return canGoForward(history) ? { ...history, index: history.index + 1 } : history;
}

/**
 * Rebuild a history from untrusted persisted data: keep only string entries
 * the app still accepts (a removed project disappears), collapse the
 * duplicates that removal can leave next to each other, and keep the current
 * position on the nearest surviving entry at or before it. Returns null when
 * nothing usable is left.
 */
export function sanitizeHistory(
  raw: unknown,
  isValid: (route: string) => boolean,
): RouteHistory | null {
  if (!raw || typeof raw !== "object") return null;
  const { entries, index } = raw as Partial<RouteHistory>;
  if (!Array.isArray(entries)) return null;
  const rawIndex =
    typeof index === "number" && Number.isInteger(index) ? index : entries.length - 1;

  const kept: string[] = [];
  let newIndex = 0;
  entries.forEach((entry, i) => {
    if (typeof entry !== "string" || !isValid(entry)) return;
    if (kept[kept.length - 1] !== entry) kept.push(entry);
    if (i <= rawIndex) newIndex = kept.length - 1;
  });
  if (kept.length === 0) return null;

  const trimmed = kept.slice(Math.max(0, kept.length - HISTORY_LIMIT));
  const shift = kept.length - trimmed.length;
  return {
    entries: trimmed,
    index: Math.min(Math.max(newIndex - shift, 0), trimmed.length - 1),
  };
}
