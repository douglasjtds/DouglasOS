import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BIN_FULL_MS,
  defaultIconCells,
  defaultLayout,
  mergeDesktopLayout,
  useDesktopStore,
} from "@/lib/store/desktopStore";
import { cellToPixel, defaultCells } from "@/lib/store/desktopGrid";
import { DESKTOP_ICON_IDS } from "@/lib/apps/registry";
import { defaultBinCell } from "@/lib/store/recycleBin";
import { useAssistantStore } from "@/lib/store/assistantStore";
import { announceRescue, useTrashNoticeStore } from "@/lib/store/trashNoticeStore";
import { useEasterEggStore } from "@/lib/store/easterEggStore";

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

describe("mergeDesktopLayout", () => {
  it("returns the defaults when nothing was saved", () => {
    expect(mergeDesktopLayout(undefined, VP)).toEqual(defaultLayout(VP));
  });

  it("keeps saved cells, drops unknown ids and backfills new launchers", () => {
    const merged = mergeDesktopLayout(
      {
        iconCells: {
          about: { col: 5, row: 3 },
          // An icon saved on the cell "resume" would default to.
          contact: { col: 0, row: 1 },
          "removed-app": { col: 9, row: 9 },
        },
      },
      VP,
    ).iconCells;
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
    const merged = mergeDesktopLayout({ iconCells: saved }, VP).iconCells;
    for (const id of legacyIds) expect(merged[id]).toEqual(saved[id]);
    expect(merged.linkedin).toEqual({ col: 1, row: 0 });
    expect(merged.email).toEqual({ col: 1, row: 3 });
    const keys = Object.values(merged).map((c) => `${c.col},${c.row}`);
    expect(new Set(keys).size).toBe(DESKTOP_ICON_IDS.length);
  });

  it("moves a new shortcut to a free neighbour when a saved icon sits on its default cell", () => {
    const merged = mergeDesktopLayout({ iconCells: { about: { col: 1, row: 0 } } }, VP).iconCells;
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
    // Saved before the bin was movable: it gets its top-right default.
    expect(store().binCell).toEqual(defaultBinCell(VP));
    localStorage.removeItem("douglasos:desktop-icons");
  });

  it("gives a layout saved without a bin cell the top-right default, or the nearest free cell", () => {
    const topRight = defaultBinCell(VP);
    expect(mergeDesktopLayout({ iconCells: defaultIconCells(VP) }, VP).binCell).toEqual(topRight);
    // An icon was dragged onto the top-right cell before the bin moved there.
    const merged = mergeDesktopLayout({ iconCells: { ...defaultIconCells(VP), skills: topRight } }, VP);
    expect(merged.iconCells.skills).toEqual(topRight);
    expect(merged.binCell).not.toEqual(topRight);
    expect(Math.max(Math.abs(merged.binCell.col - topRight.col), Math.abs(merged.binCell.row - topRight.row))).toBe(1);
  });

  it("keeps a saved bin cell, ignores a malformed one and never lets a new launcher take it", () => {
    const merged = mergeDesktopLayout({ iconCells: {}, binCell: { col: 1, row: 0 } }, VP);
    expect(merged.binCell).toEqual({ col: 1, row: 0 });
    // linkedin defaults to (1,0): it dodges the bin.
    expect(merged.iconCells.linkedin).not.toEqual({ col: 1, row: 0 });
    const keys = [...Object.values(merged.iconCells), merged.binCell].map((c) => `${c.col},${c.row}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(mergeDesktopLayout({ binCell: { col: "x" } }, VP).binCell).toEqual(defaultBinCell(VP));
  });

  it("rehydrates the bin's saved cell", async () => {
    localStorage.setItem(
      "douglasos:desktop-icons",
      JSON.stringify({ state: { iconCells: defaultIconCells(VP), binCell: { col: 7, row: 4 } }, version: 3 }),
    );
    await useDesktopStore.persist.rehydrate();
    expect(store().binCell).toEqual({ col: 7, row: 4 });
    localStorage.removeItem("douglasos:desktop-icons");
  });
});

describe("desktopStore: selection, group move and the Recycle Bin (stage 6)", () => {
  beforeEach(() => {
    store().resetLayout();
    useDesktopStore.setState({ selectedIds: [], drag: null, rescue: null, binFull: false, trashCounts: {} });
    useAssistantStore.setState({ dismissed: false, visible: false, queue: [], state: "idle" });
    useTrashNoticeStore.setState({ notice: null, seq: 0 });
  });

  it("selects, toggles, selects all (never the bin) and clears", () => {
    store().select(["about"]);
    store().toggleSelected("resume");
    expect(store().selectedIds).toEqual(["about", "resume"]);
    store().toggleSelected("about");
    expect(store().selectedIds).toEqual(["resume"]);
    store().toggleSelected("recycle-bin");
    expect(store().selectedIds).toEqual(["recycle-bin"]);
    store().toggleSelected("contact");
    expect(store().selectedIds).toEqual(["contact"]);
    store().selectAll();
    expect([...store().selectedIds].sort()).toEqual([...DESKTOP_ICON_IDS].sort());
    store().clearSelection();
    expect(store().selectedIds).toEqual([]);
  });

  it("moves a group keeping offsets and never onto the bin's cell", () => {
    store().moveIcons(["about", "resume"], "about", 88 * 5, 0);
    expect(store().iconCells.about).toEqual({ col: 5, row: 0 });
    expect(store().iconCells.resume).toEqual({ col: 5, row: 1 });
    const bin = store().binCell;
    expect(bin).toEqual(defaultBinCell(VP));
    const px = cellToPixel(bin, VP);
    store().moveIcon("skills", px.x, px.y);
    expect(store().iconCells.skills).not.toEqual(bin);
  });

  it("starts the bin top-right; dragging it snaps to a free cell, persists, and Arrange puts it back", () => {
    expect(store().binCell).toEqual(defaultBinCell(VP));
    const from = cellToPixel(store().binCell, VP);
    const to = cellToPixel({ col: 8, row: 5 }, VP);
    store().moveBin(to.x - from.x + 10, to.y - from.y - 12);
    expect(store().binCell).toEqual({ col: 8, row: 5 });
    const saved = JSON.parse(localStorage.getItem("douglasos:desktop-icons") ?? "{}");
    expect(saved.state.binCell).toEqual({ col: 8, row: 5 });
    // Icons now dodge the bin's new cell, and its old cell is free again.
    store().moveIcon("skills", to.x, to.y);
    expect(store().iconCells.skills).not.toEqual({ col: 8, row: 5 });
    store().moveIcon("experience", from.x, from.y);
    expect(store().iconCells.experience).toEqual(defaultBinCell(VP));
    store().resetLayout();
    expect(store().binCell).toEqual(defaultBinCell(VP));
    expect(store().iconCells).toEqual(defaultIconCells(VP));
  });

  it("the bin never lands on an icon, and a drop on its own cell changes nothing", () => {
    const before = store().binCell;
    store().moveBin(3, -2);
    expect(store().binCell).toBe(before);
    const from = cellToPixel(before, VP);
    const about = cellToPixel(store().iconCells.about, VP);
    store().moveBin(about.x - from.x, about.y - from.y);
    expect(store().binCell).not.toEqual(store().iconCells.about);
    expect(store().iconCells.about).toEqual({ col: 0, row: 0 });
  });

  it("trashing never removes or moves icons: it cues the rescue and the line", () => {
    const before = store().iconCells;
    const message = store().trashIcons(["whatsapp"]);
    expect(store().iconCells).toBe(before);
    expect(store().rescue).toEqual({ ids: ["whatsapp"], seq: 1 });
    expect(store().binFull).toBe(true);
    expect(message?.textKey).toBe("assistant.trash.lines.whatsapp.v1");
    // mini Douglas is around: the line goes straight to his bubble.
    expect(useAssistantStore.getState().queue[0]).toEqual(message);
    // The next rescue of the same icon rotates the line.
    expect(store().trashIcons(["whatsapp"])?.textKey).toBe("assistant.trash.lines.whatsapp.v2");
    expect(store().rescue?.seq).toBe(2);
  });

  it("ignores the bin itself and returns null when there's nothing to rescue", () => {
    expect(store().trashIcons(["recycle-bin"])).toBeNull();
    expect(store().rescue).toBeNull();
    const batch = store().trashIcons(["recycle-bin", "linkedin", "github", "resume"]);
    expect(store().rescue?.ids).toEqual(["linkedin", "github", "resume"]);
    expect(batch?.textKey).toBe("assistant.trash.lines.cleanupWithCv.v1");
  });

  it("finds the trash easter eggs: one icon, then several at once (stage 11)", () => {
    useEasterEggStore.getState().reset();
    store().trashIcons(["recycle-bin"]);
    expect(useEasterEggStore.getState().found).toEqual({});
    store().trashIcons(["whatsapp"]);
    expect(Object.keys(useEasterEggStore.getState().found)).toEqual(["trash-rescue"]);
    store().trashIcons(["linkedin", "github"]);
    expect(useEasterEggStore.getState().found).toHaveProperty("trash-cleanup");
  });

  it("falls back to the bin's own balloon when mini Douglas was dismissed", () => {
    useAssistantStore.setState({ dismissed: true });
    const message = store().trashIcons(["email"]);
    expect(announceRescue).toBeDefined();
    expect(useAssistantStore.getState().queue).toEqual([]);
    expect(useAssistantStore.getState().visible).toBe(false);
    expect(useTrashNoticeStore.getState().notice).toEqual(message);
  });

  it("the bin's 'full' glyph wears off on its own", () => {
    vi.useFakeTimers();
    try {
      store().trashIcons(["about"]);
      expect(store().binFull).toBe(true);
      vi.advanceTimersByTime(BIN_FULL_MS);
      expect(store().binFull).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("only persists the icon cells and the bin's cell", () => {
    store().select(["about"]);
    store().trashIcons(["about"]);
    const saved = JSON.parse(localStorage.getItem("douglasos:desktop-icons") ?? "{}");
    expect(Object.keys(saved.state)).toEqual(["iconCells", "binCell"]);
  });
});
