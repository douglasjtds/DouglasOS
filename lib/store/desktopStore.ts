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
import { binCell } from "@/lib/store/recycleBin";
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
  const cells = defaultCells(DESKTOP_ICON_GROUPS, vp);
  // On a very small grid the default columns could reach the Recycle Bin's
  // pinned bottom-right cell; nudge such an icon to the nearest free cell.
  const bin = binCell(vp);
  const clash = DESKTOP_ICON_IDS.find((id) => cellKey(cells[id]) === cellKey(bin));
  if (clash) {
    const others = DESKTOP_ICON_IDS.filter((id) => id !== clash).map((id) => cells[id]);
    cells[clash] = nearestFreeCell(bin, [...others, bin], vp);
  }
  return cells;
}

/**
 * Rebuild the icon layout from whatever was persisted: keep saved cells for
 * launchers that still exist, and place any new launcher on its default cell
 * (or the nearest free one if a saved icon already sits there). Pure.
 */
export function mergeIconCells(
  saved: Partial<Record<string, Cell>> | undefined,
  vp: Viewport,
): Record<DesktopIconId, Cell> {
  const defaults = defaultIconCells(vp);
  const result = {} as Record<DesktopIconId, Cell>;
  const occupied: Cell[] = [binCell(vp)];
  for (const id of DESKTOP_ICON_IDS) {
    const cell = saved?.[id];
    if (cell) {
      result[id] = cell;
      occupied.push(cell);
    }
  }
  for (const id of DESKTOP_ICON_IDS) {
    if (result[id]) continue;
    const cell = nearestFreeCell(defaults[id], occupied, vp);
    result[id] = cell;
    occupied.push(cell);
  }
  return result;
}

/** A desktop item: a movable launcher icon or the pinned Recycle Bin. */
export type DesktopItemId = DesktopIconId | "recycle-bin";

const ICON_ID_SET = new Set<string>(DESKTOP_ICON_IDS);

/** Movable launcher icons only (drops the bin and unknown ids, dedupes). */
export function onlyIcons(ids: readonly string[]): DesktopIconId[] {
  return [...new Set(ids)].filter((id): id is DesktopIconId => ICON_ID_SET.has(id));
}

/** A drag in progress: which icons follow the pointer and by how much. */
export interface IconDragState {
  ids: DesktopIconId[];
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
  /** Restore the default arrangement ("Arrange Icons"). */
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
      iconCells: defaultIconCells(),
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
          const next = moveGroup(state.iconCells, ids, anchor, dx, dy, vp, [binCell(vp)]);
          return next === state.iconCells ? state : { iconCells: next };
        }),

      resetLayout: () => set({ iconCells: defaultIconCells() }),

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
      // New launchers (e.g. the stage-3 external shortcuts) need no version
      // bump: `merge` keeps every saved cell and backfills the newcomers.
      version: 3,
      partialize: (state) => ({ iconCells: state.iconCells }),
      migrate: () => ({ iconCells: defaultIconCells() }),
      // Drop launchers that no longer exist and backfill new ones.
      merge: (persisted, current) => ({
        ...current,
        iconCells: mergeIconCells(
          (persisted as Partial<DesktopState> | undefined)?.iconCells,
          viewport(),
        ),
      }),
    },
  ),
);

/** Pixel top-left for an icon's cell, for non-store callers. */
export { cellToPixel };
