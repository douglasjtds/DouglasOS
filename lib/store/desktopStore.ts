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
  cellToPixel,
  defaultCells,
  nearestFreeCell,
  pixelToCell,
  type Cell,
} from "@/lib/store/desktopGrid";

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
  const occupied: Cell[] = [];
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

interface DesktopState {
  /** Grid cell each desktop icon currently occupies. */
  iconCells: Record<DesktopIconId, Cell>;
  /**
   * Snap an icon to the grid cell nearest its drop point. If that cell is taken
   * by another icon, the nearest free cell is used instead — icons never stack.
   */
  moveIcon: (id: DesktopIconId, dropX: number, dropY: number) => void;
  /** Restore the default arrangement ("Arrange Icons"). */
  resetLayout: () => void;
}

export const useDesktopStore = create<DesktopState>()(
  persist(
    (set) => ({
      iconCells: defaultIconCells(),

      moveIcon: (id, dropX, dropY) =>
        set((state) => {
          const vp = viewport();
          const target = pixelToCell(dropX, dropY, vp);
          const occupied = (
            Object.entries(state.iconCells) as [DesktopIconId, Cell][]
          )
            .filter(([key]) => key !== id)
            .map(([, cell]) => cell);
          const next = nearestFreeCell(target, occupied, vp);
          const current = state.iconCells[id];
          if (current.col === next.col && current.row === next.row) {
            return state;
          }
          return { iconCells: { ...state.iconCells, [id]: next } };
        }),

      resetLayout: () => set({ iconCells: defaultIconCells() }),
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
