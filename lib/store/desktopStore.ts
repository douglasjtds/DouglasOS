import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DESKTOP_ICON_GROUPS,
  DESKTOP_ICON_IDS,
  type DesktopIconId,
} from "@/lib/apps/registry";
import type { Viewport } from "@/lib/store/geometry";
import {
  FALLBACK_VIEWPORT,
  cellKey,
  cellToPixel,
  defaultCells,
  iconsInGridOrder,
  nearestFreeCell,
  type Cell,
} from "@/lib/store/desktopGrid";
import { RECYCLE_BIN_ID, defaultBinCell } from "@/lib/store/recycleBin";
import { moveGroup, toggleInSelection } from "@/lib/store/desktopSelection";
import { bumpTrashCount, trashMessage, type TrashLineCounts } from "@/lib/assistant/trash";
import type { AssistantMessage } from "@/lib/assistant/script";
import { announceRescue } from "@/lib/store/trashNoticeStore";

/** Read the live viewport; falls back to a desktop default during SSR. */
function viewport(): Viewport {
  if (typeof window === "undefined") return FALLBACK_VIEWPORT;
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * The default column-first layout for the current viewport: the apps (+ CV)
 * fill the first column, the external shortcuts start the next one.
 */
export function defaultIconCells(
  vp: Viewport = viewport(),
): Record<DesktopIconId, Cell> {
  return defaultCells(DESKTOP_ICON_GROUPS, vp);
}

/**
 * The Recycle Bin's default cell given where the icons are: the top-right
 * corner, or the nearest free cell if an icon already sits there (only on a
 * very narrow grid by default, or in an older saved layout).
 */
export function defaultBinCellFor(icons: Partial<Record<DesktopIconId, Cell>>, vp: Viewport): Cell {
  const occupied = Object.values(icons).filter((c): c is Cell => c !== undefined);
  return nearestFreeCell(defaultBinCell(vp), occupied, vp);
}

/** Icon cells + the bin's cell: everything that is persisted. */
export interface DesktopLayout {
  iconCells: Record<DesktopIconId, Cell>;
  binCell: Cell;
}

/** The default arrangement ("Arrange Icons"): icons top-left, bin top-right. */
export function defaultLayout(vp: Viewport = viewport()): DesktopLayout {
  const iconCells = defaultIconCells(vp);
  return { iconCells, binCell: defaultBinCellFor(iconCells, vp) };
}

function isCell(value: unknown): value is Cell {
  const c = value as Cell | null | undefined;
  return typeof c?.col === "number" && typeof c?.row === "number";
}

/**
 * Rebuild the layout from whatever was persisted: keep saved cells for
 * launchers that still exist, keep the bin's saved cell (a layout saved before
 * the bin was movable has none: it gets the top-right default, or the nearest
 * free cell if an icon sits there), and place any new launcher on its default
 * cell (or the nearest free one). Pure.
 */
export function mergeDesktopLayout(
  saved: { iconCells?: Partial<Record<string, Cell>>; binCell?: unknown } | undefined,
  vp: Viewport,
): DesktopLayout {
  const defaults = defaultIconCells(vp);
  const iconCells = {} as Record<DesktopIconId, Cell>;
  const occupied: Cell[] = [];
  for (const id of DESKTOP_ICON_IDS) {
    const cell = saved?.iconCells?.[id];
    if (isCell(cell)) {
      iconCells[id] = cell;
      occupied.push(cell);
    }
  }
  const savedBin = saved?.binCell;
  const binCell =
    isCell(savedBin) && !occupied.some((c) => cellKey(c) === cellKey(savedBin))
      ? savedBin
      : nearestFreeCell(defaultBinCell(vp), occupied, vp);
  occupied.push(binCell);
  for (const id of DESKTOP_ICON_IDS) {
    if (iconCells[id]) continue;
    const cell = nearestFreeCell(defaults[id], occupied, vp);
    iconCells[id] = cell;
    occupied.push(cell);
  }
  return { iconCells, binCell };
}

/** A desktop item: a launcher icon or the Recycle Bin. */
export type DesktopItemId = DesktopIconId | "recycle-bin";

const ICON_ID_SET = new Set<string>(DESKTOP_ICON_IDS);

/** Movable launcher icons only (drops the bin and unknown ids, dedupes). */
export function onlyIcons(ids: readonly string[]): DesktopIconId[] {
  return [...new Set(ids)].filter((id): id is DesktopIconId => ICON_ID_SET.has(id));
}

/**
 * A drag in progress: which items follow the pointer and by how much (a
 * launcher group, or the Recycle Bin alone).
 */
export interface IconDragState {
  ids: DesktopItemId[];
  dx: number;
  dy: number;
  /** The pointer is over the Recycle Bin (it highlights as a drop target). */
  overBin: boolean;
}

/** The last rescue: icons that went into the bin and came back (animation cue). */
export interface RescueState {
  ids: DesktopIconId[];
  /** Increments on every rescue, so each one replays the animation. */
  seq: number;
}

/** How long the bin shows its "full" glyph after a rescue (ms). */
export const BIN_FULL_MS = 1400;
let binFullTimer: ReturnType<typeof setTimeout> | null = null;

interface DesktopState {
  /** Grid cell each desktop icon currently occupies. */
  iconCells: Record<DesktopIconId, Cell>;
  /** The Recycle Bin's cell (top-right by default; draggable, persisted). */
  binCell: Cell;
  /** Selected desktop items (not persisted). The bin can be selected alone. */
  selectedIds: DesktopItemId[];
  /** The drag in progress, if any (not persisted). */
  drag: IconDragState | null;
  rescue: RescueState | null;
  /** The bin shows paper over the rim for a moment after a rescue. */
  binFull: boolean;
  /** Rescue line rotation per line key (not persisted). */
  trashCounts: TrashLineCounts;

  /**
   * Snap an icon to the grid cell nearest its drop point. If that cell is taken
   * by another icon, the nearest free cell is used instead — icons never stack.
   */
  moveIcon: (id: DesktopIconId, dropX: number, dropY: number) => void;
  /**
   * Move a group by a pixel offset, keeping relative positions (`moveGroup`:
   * `anchor` first, then grid order; the bin's cell is reserved).
   */
  moveIcons: (ids: readonly DesktopIconId[], anchor: DesktopIconId, dx: number, dy: number) => void;
  /**
   * Move the Recycle Bin by a pixel offset: it snaps to the nearest cell no
   * icon occupies. Only a direct drag moves it (it never joins a group).
   */
  moveBin: (dx: number, dy: number) => void;
  /** Restore the default arrangement ("Arrange Icons"): icons top-left, bin top-right. */
  resetLayout: () => void;

  /** Replace the selection. */
  select: (ids: readonly DesktopItemId[]) => void;
  /** Ctrl+click / Ctrl+Space: toggle one icon (the bin never joins a group). */
  toggleSelected: (id: DesktopItemId) => void;
  /** Ctrl+A: every launcher icon (never the bin). */
  selectAll: () => void;
  clearSelection: () => void;

  setDrag: (drag: IconDragState | null) => void;
  /**
   * "Delete" an icon (dropped on the bin, Delete key, context menu): nothing
   * is ever removed. The icons stay on their cells (the UI animates them into
   * the bin and back), the bin flashes "full" and mini Douglas — or, if he
   * was dismissed, the bin's own balloon — says the rescue line. The bin
   * itself is ignored. Returns the line, or null when there was nothing to
   * rescue.
   */
  trashIcons: (ids: readonly DesktopItemId[]) => AssistantMessage | null;
}

export const useDesktopStore = create<DesktopState>()(
  persist(
    (set, get) => ({
      ...defaultLayout(),
      selectedIds: [],
      drag: null,
      rescue: null,
      binFull: false,
      trashCounts: {},

      moveIcon: (id, dropX, dropY) => {
        const vp = viewport();
        const from = cellToPixel(get().iconCells[id], vp);
        get().moveIcons([id], id, dropX - from.x, dropY - from.y);
      },

      moveIcons: (ids, anchor, dx, dy) =>
        set((state) => {
          const vp = viewport();
          const next = moveGroup(state.iconCells, ids, anchor, dx, dy, vp, [state.binCell]);
          return next === state.iconCells ? state : { iconCells: next };
        }),

      moveBin: (dx, dy) =>
        set((state) => {
          const cells = { ...state.iconCells, [RECYCLE_BIN_ID]: state.binCell } as Record<DesktopItemId, Cell>;
          const next = moveGroup(cells, [RECYCLE_BIN_ID], RECYCLE_BIN_ID, dx, dy, viewport());
          return next === cells ? state : { binCell: next[RECYCLE_BIN_ID] };
        }),

      resetLayout: () => set(defaultLayout()),

      select: (ids) => set({ selectedIds: [...new Set(ids)] }),
      toggleSelected: (id) =>
        set((s) => {
          if (id === "recycle-bin") return { selectedIds: s.selectedIds.includes(id) ? [] : [id] };
          return { selectedIds: toggleInSelection(s.selectedIds.filter((x) => x !== "recycle-bin"), id) };
        }),
      selectAll: () => set((s) => ({ selectedIds: iconsInGridOrder(s.iconCells) })),
      clearSelection: () => set((s) => (s.selectedIds.length === 0 ? s : { selectedIds: [] })),

      setDrag: (drag) => set({ drag }),

      trashIcons: (ids) => {
        const icons = onlyIcons(ids);
        if (icons.length === 0) return null;
        const s = get();
        const message = trashMessage(icons, s.trashCounts);
        set({
          rescue: { ids: icons, seq: (s.rescue?.seq ?? 0) + 1 },
          binFull: true,
          trashCounts: bumpTrashCount(s.trashCounts, icons),
        });
        if (binFullTimer) clearTimeout(binFullTimer);
        binFullTimer = setTimeout(() => set({ binFull: false }), BIN_FULL_MS);
        announceRescue(message);
        return message;
      },
    }),
    {
      name: "douglasos:desktop-icons",
      // v3: the XP grid (88×96 pitch, column-first) replaced the v1 scattered
      // layout, so any older arrangement is dropped. Drags persist again from v3.
      // New launchers (e.g. the stage-3 external shortcuts) and the movable
      // bin's cell need no version bump: `merge` keeps every saved cell and
      // backfills what's missing (the bin gets its top-right default).
      version: 3,
      partialize: (state) => ({ iconCells: state.iconCells, binCell: state.binCell }),
      migrate: () => defaultLayout(),
      // Drop launchers that no longer exist and backfill new ones + the bin.
      merge: (persisted, current) => ({
        ...current,
        ...mergeDesktopLayout(persisted as Partial<DesktopLayout> | undefined, viewport()),
      }),
    },
  ),
);

/** Pixel top-left for an icon's cell, for non-store callers. */
export { cellToPixel };
