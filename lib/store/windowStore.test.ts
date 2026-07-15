import { beforeEach, describe, expect, it } from "vitest";
import {
  Z_BASE,
  reconcilePersisted,
  useWindowStore,
  type WindowInstance,
} from "@/lib/store/windowStore";
import {
  DOCK_RESERVED,
  MENU_BAR_H,
  maximizeRect,
  type Rect,
  type Viewport,
} from "@/lib/store/geometry";

/** Reset the singleton store to its initial shape before each test. */
function resetStore() {
  useWindowStore.setState({
    windows: {},
    order: [],
    focusedId: null,
    topZ: Z_BASE,
    openCount: 0,
  });
}

const store = () => useWindowStore.getState();

describe("windowStore", () => {
  beforeEach(resetStore);

  describe("openWindow", () => {
    it("opens a new window: registers it, focuses it, bumps z and openCount", () => {
      store().openWindow("about");
      const s = store();
      expect(s.windows.about).toBeDefined();
      expect(s.order).toEqual(["about"]);
      expect(s.focusedId).toBe("about");
      expect(s.openCount).toBe(1);
      expect(s.windows.about.z).toBe(Z_BASE + 1);
    });

    it("re-opening an open app focuses and un-minimizes without duplicating order", () => {
      store().openWindow("about");
      store().minimizeWindow("about");
      store().openWindow("about");
      const s = store();
      expect(s.windows.about.minimized).toBe(false);
      expect(s.focusedId).toBe("about");
      expect(s.order).toEqual(["about"]);
      // openCount only counts genuinely new opens.
      expect(s.openCount).toBe(1);
    });
  });

  describe("focusWindow", () => {
    it("raises a window above the others", () => {
      store().openWindow("about");
      store().openWindow("projects");
      store().focusWindow("about");
      const s = store();
      expect(s.focusedId).toBe("about");
      expect(s.windows.about.z).toBeGreaterThan(s.windows.projects.z);
    });

    it("is a no-op when the window is already top-most and focused", () => {
      store().openWindow("about");
      const zBefore = store().windows.about.z;
      const topZBefore = store().topZ;
      store().focusWindow("about");
      expect(store().windows.about.z).toBe(zBefore);
      expect(store().topZ).toBe(topZBefore);
    });
  });

  describe("minimize / restore", () => {
    it("minimize moves focus to the next-highest non-minimized window", () => {
      store().openWindow("about");
      store().openWindow("projects"); // projects is now focused + top
      store().minimizeWindow("projects");
      const s = store();
      expect(s.windows.projects.minimized).toBe(true);
      expect(s.focusedId).toBe("about");
    });

    it("restore un-minimizes, focuses, and raises the window", () => {
      store().openWindow("about");
      store().minimizeWindow("about");
      store().restoreWindow("about");
      const s = store();
      expect(s.windows.about.minimized).toBe(false);
      expect(s.focusedId).toBe("about");
      expect(s.windows.about.z).toBe(s.topZ);
    });
  });

  describe("toggleMaximize", () => {
    it("maximizes then restores the original rect via restoreRect", () => {
      store().openWindow("about");
      const original = { ...store().windows.about.rect };

      store().toggleMaximize("about");
      expect(store().windows.about.maximized).toBe(true);
      expect(store().windows.about.restoreRect).toEqual(original);

      store().toggleMaximize("about");
      const s = store();
      expect(s.windows.about.maximized).toBe(false);
      expect(s.windows.about.restoreRect).toBeNull();
      expect(s.windows.about.rect).toEqual(original);
    });
  });

  describe("moveWindow", () => {
    it("updates the window position when not maximized", () => {
      store().openWindow("about");
      store().moveWindow("about", 300, 200);
      const { rect } = store().windows.about;
      // y is clamped to >= MENU_BAR_H; 200 is comfortably below it.
      expect(rect.x).toBe(300);
      expect(rect.y).toBe(200);
    });

    it("is a no-op while the window is maximized", () => {
      store().openWindow("about");
      store().toggleMaximize("about");
      const before = { ...store().windows.about.rect };
      store().moveWindow("about", 999, 999);
      expect(store().windows.about.rect).toEqual(before);
    });
  });

  describe("resizeWindow", () => {
    it("resizes from the captured origin rect when not maximized", () => {
      store().openWindow("about");
      const origin = { ...store().windows.about.rect };
      store().resizeWindow("about", "se", origin, 40, 30);
      const { rect } = store().windows.about;
      expect(rect.width).toBe(origin.width + 40);
      expect(rect.height).toBe(origin.height + 30);
      expect(rect.x).toBe(origin.x);
      expect(rect.y).toBe(origin.y);
    });

    it("is a no-op while the window is maximized", () => {
      store().openWindow("about");
      store().toggleMaximize("about");
      const before = { ...store().windows.about.rect };
      store().resizeWindow("about", "se", before, 40, 30);
      expect(store().windows.about.rect).toEqual(before);
    });
  });

  describe("close", () => {
    it("closeWindow removes the window and re-picks focus", () => {
      store().openWindow("about");
      store().openWindow("projects");
      store().closeWindow("projects");
      const s = store();
      expect(s.windows.projects).toBeUndefined();
      expect(s.order).toEqual(["about"]);
      expect(s.focusedId).toBe("about");
    });

    it("closeAll empties the store", () => {
      store().openWindow("about");
      store().openWindow("projects");
      store().closeAll();
      const s = store();
      expect(s.windows).toEqual({});
      expect(s.order).toEqual([]);
      expect(s.focusedId).toBeNull();
    });
  });
});

describe("reconcilePersisted", () => {
  const VP: Viewport = { width: 1440, height: 900 };

  function win(
    id: string,
    rect: Rect = { x: 100, y: 100, width: 600, height: 400 },
    extra: Partial<WindowInstance> = {},
  ): WindowInstance {
    return {
      id: id as WindowInstance["id"],
      z: Z_BASE + 1,
      rect,
      minimized: false,
      maximized: false,
      restoreRect: null,
      ...extra,
    };
  }

  it("returns the empty initial shape when nothing was persisted", () => {
    const r = reconcilePersisted(undefined, VP);
    expect(r.windows).toEqual({});
    expect(r.order).toEqual([]);
    expect(r.focusedId).toBeNull();
    expect(r.topZ).toBe(Z_BASE);
  });

  it("drops windows whose app no longer exists and clears stale focus", () => {
    const r = reconcilePersisted(
      {
        windows: { about: win("about"), ghost: win("ghost") },
        // Stale data: "ghost" is not a real app id (simulates a removed app).
        order: ["about", "ghost"] as WindowInstance["id"][],
        focusedId: "ghost" as WindowInstance["id"],
        topZ: 105,
        openCount: 2,
      },
      VP,
    );
    expect(r.windows.about).toBeDefined();
    expect(r.windows.ghost).toBeUndefined();
    expect(r.order).toEqual(["about"]);
    expect(r.focusedId).toBeNull();
  });

  it("re-clamps an oversized restored rect to the current viewport", () => {
    const r = reconcilePersisted(
      {
        windows: {
          about: win("about", { x: 0, y: 0, width: 5000, height: 5000 }),
        },
        order: ["about"],
        focusedId: "about",
        topZ: 101,
        openCount: 1,
      },
      VP,
    );
    const { rect } = r.windows.about;
    expect(rect.width).toBeLessThanOrEqual(VP.width);
    expect(rect.height).toBeLessThanOrEqual(VP.height - MENU_BAR_H - DOCK_RESERVED);
  });

  it("recomputes a maximized window to the current maximize rect", () => {
    const r = reconcilePersisted(
      {
        windows: {
          about: win("about", { x: 0, y: 0, width: 600, height: 400 }, {
            maximized: true,
            restoreRect: { x: 100, y: 100, width: 600, height: 400 },
          }),
        },
        order: ["about"],
        focusedId: "about",
        topZ: 101,
        openCount: 1,
      },
      VP,
    );
    expect(r.windows.about.rect).toEqual(maximizeRect(VP));
  });

  it("keeps topZ at or above the highest restored window z", () => {
    const r = reconcilePersisted(
      {
        windows: { about: win("about", undefined, { z: 142 }) },
        order: ["about"],
        focusedId: "about",
        topZ: 100,
        openCount: 1,
      },
      VP,
    );
    expect(r.topZ).toBeGreaterThanOrEqual(142);
  });
});
