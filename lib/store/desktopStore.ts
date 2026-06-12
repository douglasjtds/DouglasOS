import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LauncherId } from "@/lib/apps/registry";
import type { Viewport } from "@/lib/store/geometry";
import {
  DEFAULT_CELLS,
  cellToPixel,
  nearestFreeCell,
  pixelToCell,
  type Cell,
} from "@/lib/store/desktopGrid";

/** Read the live viewport (client-only; actions never run during SSR). */
function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

interface DesktopState {
  /** Grid cell each launcher's icon currently occupies. */
  iconCells: Record<LauncherId, Cell>;
  /**
   * Snap an icon to the grid cell nearest its drop point. If that cell is taken
   * by another icon, the nearest free cell is used instead — icons never stack.
   */
  moveIcon: (id: LauncherId, dropX: number, dropY: number) => void;
  /** Restore the default arrangement. */
  resetLayout: () => void;
}

export const useDesktopStore = create<DesktopState>()(
  persist(
    (set) => ({
      iconCells: { ...DEFAULT_CELLS },

      moveIcon: (id, dropX, dropY) =>
        set((state) => {
          const vp = viewport();
          const target = pixelToCell(dropX, dropY, vp);
          const occupied = (
            Object.entries(state.iconCells) as [LauncherId, Cell][]
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

      resetLayout: () => set({ iconCells: { ...DEFAULT_CELLS } }),
    }),
    {
      name: "douglasos:desktop-icons",
      version: 2,
      // Only the positions are worth persisting (actions are recreated on load).
      partialize: (state) => ({ iconCells: state.iconCells }),
      // v1 used a tidy corner-block default; drop any older saved arrangement so
      // the new scattered default applies. User drags persist again from v2 on.
      migrate: () => ({ iconCells: { ...DEFAULT_CELLS } }),
      // Drop any launcher that no longer exists / backfill new ones from defaults.
      merge: (persisted, current) => {
        const saved: Partial<Record<LauncherId, Cell>> =
          (persisted as Partial<DesktopState>)?.iconCells ?? {};
        const iconCells = { ...DEFAULT_CELLS };
        for (const key of Object.keys(iconCells) as LauncherId[]) {
          if (saved[key]) iconCells[key] = saved[key];
        }
        return { ...current, iconCells };
      },
    },
  ),
);

/** Pixel top-left for an icon's cell, for non-store callers. */
export { cellToPixel };
