import { describe, expect, it } from "vitest";
import type { BrowserPage } from "@/lib/browser/sites";
import {
  MAX_TABS,
  activeTab,
  canGoBack,
  canGoForward,
  closeTab,
  createBrowser,
  currentPage,
  goBack,
  goForward,
  navigate,
  openTab,
  reload,
  selectTab,
} from "@/lib/browser/tabs";

const site = (siteId: string): BrowserPage => ({ kind: "site", siteId });
const page = (s: ReturnType<typeof createBrowser>) => currentPage(activeTab(s));

describe("browser tabs", () => {
  it("creates one tab per page, first active; home when empty", () => {
    const s = createBrowser([site("linkedin"), site("gasolinha")]);
    expect(s.tabs).toHaveLength(2);
    expect(page(s)).toEqual(site("linkedin"));
    expect(page(createBrowser([]))).toEqual({ kind: "home" });
  });

  it("navigates with a per-tab Back/Forward history", () => {
    let s = createBrowser([site("linkedin"), site("gasolinha")]);
    s = navigate(s, site("poupensa"));
    expect(page(s)).toEqual(site("poupensa"));
    expect(canGoBack(activeTab(s))).toBe(true);
    s = goBack(s);
    expect(page(s)).toEqual(site("linkedin"));
    expect(canGoForward(activeTab(s))).toBe(true);
    s = goForward(s);
    expect(page(s)).toEqual(site("poupensa"));
    // The other tab is untouched.
    s = selectTab(s, 2);
    expect(page(s)).toEqual(site("gasolinha"));
    expect(canGoBack(activeTab(s))).toBe(false);
  });

  it("drops Forward entries on a new navigation and ignores the same page", () => {
    let s = createBrowser([site("a")]);
    s = navigate(navigate(s, site("b")), site("c"));
    s = goBack(goBack(s));
    s = navigate(s, site("d"));
    expect(activeTab(s).history).toEqual([site("a"), site("d")]);
    expect(navigate(s, site("d"))).toBe(s);
  });

  it("bumps the reload key of the active tab only", () => {
    const s = reload(createBrowser([site("a"), site("b")]));
    expect(s.tabs.map((t) => t.reloadKey)).toEqual([1, 0]);
  });

  it("opens tabs up to the limit, then reports it", () => {
    let s = createBrowser([site("a")]);
    for (let i = 1; i < MAX_TABS; i++) {
      const r = openTab(s, { kind: "home" }, MAX_TABS);
      expect(r.limited).toBe(false);
      s = r.state;
    }
    expect(s.tabs).toHaveLength(MAX_TABS);
    expect(s.activeId).toBe(s.tabs.at(-1)!.id);
    const r = openTab(s, { kind: "home" }, MAX_TABS);
    expect(r).toEqual({ state: s, limited: true });
  });

  it("closing the active tab activates its neighbor; the last one returns null", () => {
    let s = createBrowser([site("a"), site("b"), site("c")]);
    s = selectTab(s, 2);
    s = closeTab(s, 2)!;
    expect(s.activeId).toBe(3);
    s = closeTab(s, 3)!;
    expect(s.activeId).toBe(1);
    expect(closeTab(s, 1)).toBeNull();
  });

  it("closing a background tab keeps the active one", () => {
    const s = closeTab(createBrowser([site("a"), site("b")]), 2)!;
    expect(s.activeId).toBe(1);
    expect(selectTab(s, 99)).toBe(s);
  });
});
