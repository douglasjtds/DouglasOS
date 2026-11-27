import type { BrowserPage } from "@/lib/browser/sites";

/**
 * DouglasOS Web tab state (pure; the window keeps it in React state). Each
 * tab has its own Back/Forward history of pages and a `reloadKey` the UI
 * bumps to remount the iframe on Refresh.
 *
 * Only the pages we navigate to are in the history: a cross-origin iframe
 * never tells its parent about clicks inside it, so Back/Forward move between
 * the sites opened from the browser's own address bar, favorites and tabs.
 */

export interface BrowserTab {
  id: number;
  history: BrowserPage[];
  index: number;
  reloadKey: number;
}

export interface BrowserState {
  tabs: BrowserTab[];
  activeId: number;
  nextId: number;
}

/** Tab limits: a browser inside a browser has its limits. */
export const MAX_TABS = 4;
export const MAX_TABS_MOBILE = 2;

function tab(id: number, page: BrowserPage): BrowserTab {
  return { id, history: [page], index: 0, reloadKey: 0 };
}

/** A fresh browser with one tab per page (at least one: home), the first active. */
export function createBrowser(pages: readonly BrowserPage[]): BrowserState {
  const list = pages.length ? pages : [{ kind: "home" } as const];
  const tabs = list.map((p, i) => tab(i + 1, p));
  return { tabs, activeId: 1, nextId: tabs.length + 1 };
}

export function activeTab(state: BrowserState): BrowserTab {
  return state.tabs.find((t) => t.id === state.activeId) ?? state.tabs[0];
}

export function currentPage(t: BrowserTab): BrowserPage {
  return t.history[t.index];
}

export function canGoBack(t: BrowserTab): boolean {
  return t.index > 0;
}

export function canGoForward(t: BrowserTab): boolean {
  return t.index < t.history.length - 1;
}

function samePage(a: BrowserPage, b: BrowserPage): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "site" && b.kind === "site") return a.siteId === b.siteId;
  if (a.kind === "blocked" && b.kind === "blocked") return a.query === b.query;
  return true;
}

function updateActive(state: BrowserState, update: (t: BrowserTab) => BrowserTab): BrowserState {
  return {
    ...state,
    tabs: state.tabs.map((t) => (t.id === state.activeId ? update(t) : t)),
  };
}

/** Navigate the active tab (drops its Forward entries; same page = no-op). */
export function navigate(state: BrowserState, page: BrowserPage): BrowserState {
  const current = currentPage(activeTab(state));
  if (samePage(current, page)) return state;
  return updateActive(state, (t) => {
    const history = [...t.history.slice(0, t.index + 1), page];
    return { ...t, history, index: history.length - 1 };
  });
}

export function goBack(state: BrowserState): BrowserState {
  return updateActive(state, (t) => (canGoBack(t) ? { ...t, index: t.index - 1 } : t));
}

export function goForward(state: BrowserState): BrowserState {
  return updateActive(state, (t) => (canGoForward(t) ? { ...t, index: t.index + 1 } : t));
}

export function reload(state: BrowserState): BrowserState {
  return updateActive(state, (t) => ({ ...t, reloadKey: t.reloadKey + 1 }));
}

/**
 * Open `page` in a new active tab, unless `max` tabs are already open: then
 * the state is returned untouched and `limited` is true (the UI shows the
 * "that's too much" message).
 */
export function openTab(
  state: BrowserState,
  page: BrowserPage,
  max: number,
): { state: BrowserState; limited: boolean } {
  if (state.tabs.length >= max) return { state, limited: true };
  const id = state.nextId;
  return {
    state: { tabs: [...state.tabs, tab(id, page)], activeId: id, nextId: id + 1 },
    limited: false,
  };
}

export function selectTab(state: BrowserState, id: number): BrowserState {
  return state.tabs.some((t) => t.id === id) ? { ...state, activeId: id } : state;
}

/**
 * Close a tab. Closing the active one activates its right neighbor (or the
 * left one at the end). Closing the last tab returns null: the window closes,
 * like the classic browser.
 */
export function closeTab(state: BrowserState, id: number): BrowserState | null {
  const index = state.tabs.findIndex((t) => t.id === id);
  if (index === -1) return state;
  const tabs = state.tabs.filter((t) => t.id !== id);
  if (!tabs.length) return null;
  const activeId =
    state.activeId === id ? tabs[Math.min(index, tabs.length - 1)].id : state.activeId;
  return { ...state, tabs, activeId };
}
