import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultIconCells,
  mergeIconCells,
  useDesktopStore,
} from "@/lib/store/desktopStore";
import { cellToPixel, defaultCells } from "@/lib/store/desktopGrid";
import { DESKTOP_ICON_IDS } from "@/lib/apps/registry";

const store = () => useDesktopStore.getState();

const VP = { width: 1440, height: 900 };

describe("desktopStore", () => {
  beforeEach(() => {
    store().resetLayout();
  });

  it("starts from the column-first default arrangement in CTA order", () => {
    expect(store().iconCells).toEqual(defaultIconCells(VP));
    expect(store().iconCells.about).toEqual({ col: 0, row: 0 });
    expect(store().iconCells.resume).toEqual({ col: 0, row: 1 });
    expect(store().iconCells.contact).toEqual({ col: 0, row: 2 });
  });

  it("has no desktop icon for Display Properties", () => {
    expect(Object.keys(store().iconCells)).not.toContain("display");
    expect(Object.keys(store().iconCells).sort()).toEqual(
      [...DESKTOP_ICON_IDS].sort(),
    );
  });

  it("moveIcon snaps an icon to the grid cell nearest the drop point", () => {
    const target = { col: 3, row: 2 };
    const px = cellToPixel(target, VP);
    store().moveIcon("about", px.x, px.y);
    expect(store().iconCells.about).toEqual(target);
  });

  it("moveIcon dodges to a free neighbour when the target cell is occupied", () => {
    const occupied = store().iconCells.experience;
    const px = cellToPixel(occupied, VP);
    store().moveIcon("about", px.x, px.y);
    const placed = store().iconCells.about;
    expect(placed).not.toEqual(occupied);
    const dist = Math.max(
      Math.abs(placed.col - occupied.col),
      Math.abs(placed.row - occupied.row),
    );
    expect(dist).toBe(1);
  });

  it("moveIcon is a no-op when the icon lands on its own current cell", () => {
    const before = store().iconCells;
    const px = cellToPixel(before.about, VP);
    store().moveIcon("about", px.x, px.y);
    expect(store().iconCells).toBe(before);
  });

  it("resetLayout restores the default cells after a move", () => {
    store().moveIcon("about", 600, 400);
    store().resetLayout();
    expect(store().iconCells).toEqual(defaultIconCells(VP));
  });
});

describe("mergeIconCells", () => {
  it("returns the defaults when nothing was saved", () => {
    expect(mergeIconCells(undefined, VP)).toEqual(defaultIconCells(VP));
  });

  it("keeps saved cells, drops unknown ids and backfills new launchers", () => {
    const merged = mergeIconCells(
      {
        about: { col: 5, row: 3 },
        // An icon saved on the cell "resume" would default to.
        contact: { col: 0, row: 1 },
        "removed-app": { col: 9, row: 9 },
      },
      VP,
    );
    expect(merged.about).toEqual({ col: 5, row: 3 });
    expect(merged.contact).toEqual({ col: 0, row: 1 });
    expect(merged).not.toHaveProperty("removed-app");
    // resume's default cell was taken → it lands on a free neighbour.
    expect(merged.resume).not.toEqual({ col: 0, row: 1 });
    const keys = Object.values(merged).map((c) => `${c.col},${c.row}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps a pre-stage-3 saved layout intact and backfills the new shortcuts", () => {
    // What a v3 user saved before the external shortcuts existed: the seven
    // original icons, one of them dragged elsewhere.
    const legacyIds = [
      "about",
      "resume",
      "contact",
      "projects",
      "experience",
      "skills",
      "how-i-work-with-ai",
    ] as const;
    const saved: Record<string, { col: number; row: number }> = {
      ...defaultCells(legacyIds, VP),
      skills: { col: 4, row: 4 },
    };
    const merged = mergeIconCells(saved, VP);
    for (const id of legacyIds) expect(merged[id]).toEqual(saved[id]);
    expect(merged.linkedin).toEqual({ col: 1, row: 0 });
    expect(merged.email).toEqual({ col: 1, row: 3 });
    const keys = Object.values(merged).map((c) => `${c.col},${c.row}`);
    expect(new Set(keys).size).toBe(DESKTOP_ICON_IDS.length);
  });

  it("moves a new shortcut to a free neighbour when a saved icon sits on its default cell", () => {
    const merged = mergeIconCells({ about: { col: 1, row: 0 } }, VP);
    expect(merged.about).toEqual({ col: 1, row: 0 });
    expect(merged.linkedin).not.toEqual({ col: 1, row: 0 });
    const keys = Object.values(merged).map((c) => `${c.col},${c.row}`);
    expect(new Set(keys).size).toBe(DESKTOP_ICON_IDS.length);
  });

  it("is what the persisted store rehydrates through", async () => {
    localStorage.setItem(
      "douglasos:desktop-icons",
      JSON.stringify({ state: { iconCells: { about: { col: 6, row: 5 } } }, version: 3 }),
    );
    await useDesktopStore.persist.rehydrate();
    expect(store().iconCells.about).toEqual({ col: 6, row: 5 });
    expect(store().iconCells.linkedin).toEqual({ col: 1, row: 0 });
    localStorage.removeItem("douglasos:desktop-icons");
  });
});
