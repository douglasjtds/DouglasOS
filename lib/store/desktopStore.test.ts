import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BIN_FULL_MS,
  defaultIconCells,
  mergeIconCells,
  useDesktopStore,
} from "@/lib/store/desktopStore";
import { cellToPixel, defaultCells } from "@/lib/store/desktopGrid";
import { DESKTOP_ICON_IDS } from "@/lib/apps/registry";
import { binCell } from "@/lib/store/recycleBin";
import { useAssistantStore } from "@/lib/store/assistantStore";
import { announceRescue, useTrashNoticeStore } from "@/lib/store/trashNoticeStore";

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
    const bin = binCell(VP);
    const px = cellToPixel(bin, VP);
    store().moveIcon("skills", px.x, px.y);
    expect(store().iconCells.skills).not.toEqual(bin);
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

  it("only persists the icon cells", () => {
    store().select(["about"]);
    store().trashIcons(["about"]);
    const saved = JSON.parse(localStorage.getItem("douglasos:desktop-icons") ?? "{}");
    expect(Object.keys(saved.state)).toEqual(["iconCells"]);
  });
});
