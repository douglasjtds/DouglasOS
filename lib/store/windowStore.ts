import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WINDOW_APPS, getApp, type AppId } from "@/lib/apps/registry";
import {
  clampPosition,
  clampRect,
  clampSize,
  initialRect,
  maximizeRect,
  resizeRect,
  type Edge,
  type Rect,
  type Viewport,
} from "@/lib/store/geometry";

/** Base z-index for windows; each focus bumps `topZ` above this. */
export const Z_BASE = 100;

export interface WindowInstance {
  id: AppId;
  z: number;
  rect: Rect;
  minimized: boolean;
  maximized: boolean;
  /** Pre-maximize rect, restored on un-maximize. Null when not maximized. */
  restoreRect: Rect | null;
}

interface WindowState {
  /** Only OPEN apps are present (singleton-per-app, so key === AppId). */
  windows: Record<string, WindowInstance>;
  /** Open ids in open order — used for Tab cycling and focus fallback. */
  order: AppId[];
  focusedId: AppId | null;
  /** Monotonic z counter; starts at Z_BASE, increments on focus. */
  topZ: number;
  /** Total opens this session, drives the cascade offset. */
  openCount: number;

  openWindow: (id: AppId) => void;
  closeWindow: (id: AppId) => void;
  closeAll: () => void;
  focusWindow: (id: AppId) => void;
  minimizeWindow: (id: AppId) => void;
  restoreWindow: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  moveWindow: (id: AppId, x: number, y: number) => void;
  /**
   * Resize by dragging an edge/corner. `origin` is the rect captured at the
   * start of the drag; `dx/dy` are the cumulative pointer deltas since then.
   */
  resizeWindow: (
    id: AppId,
    edge: Edge,
    origin: Rect,
    dx: number,
    dy: number,
  ) => void;
}

/** The slice of state that survives a reload (actions are recreated on load). */
type PersistedWindowState = Pick<
  WindowState,
  "windows" | "order" | "focusedId" | "topZ" | "openCount"
>;

/** App ids that still exist — persisted windows for removed apps are dropped. */
const KNOWN_APP_IDS = new Set<AppId>(WINDOW_APPS.map((a) => a.id));

/**
 * Rebuild a valid window state from whatever was persisted, against the CURRENT
 * viewport: drop windows whose app no longer exists, re-clamp every rect so a
 * smaller screen can't strand a window off-screen or oversized, recompute
 * maximized windows, and keep `topZ` above the highest restored window. Pure
 * (viewport injected) so it's testable and SSR-safe.
 */
export function reconcilePersisted(
  persisted: Partial<PersistedWindowState> | undefined,
  vp: Viewport,
): PersistedWindowState {
  const empty: PersistedWindowState = {
    windows: {},
    order: [],
    focusedId: null,
    topZ: Z_BASE,
    openCount: 0,
  };
  if (!persisted?.windows) return empty;

  const windows: Record<string, WindowInstance> = {};
  let topZ = Z_BASE;
  for (const [id, w] of Object.entries(persisted.windows)) {
    if (!KNOWN_APP_IDS.has(id as AppId)) continue;
    const fitted = clampRect(clampSize(w.rect, vp), vp);
    windows[id] = {
      ...w,
      rect: w.maximized ? maximizeRect(vp) : fitted,
      restoreRect: w.restoreRect
        ? clampRect(clampSize(w.restoreRect, vp), vp)
        : null,
    };
    topZ = Math.max(topZ, w.z);
  }

  const order = (persisted.order ?? []).filter((id) => windows[id]);
  const focusedId =
    persisted.focusedId && windows[persisted.focusedId]
      ? persisted.focusedId
      : null;

  return {
    windows,
    order,
    focusedId,
    topZ,
    openCount: persisted.openCount ?? order.length,
  };
}

/** Read the live viewport (client-only; actions never run during SSR). */
function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

/** Pick the highest-z non-minimized window as the next focus, else null. */
function nextFocus(
  windows: Record<string, WindowInstance>,
  excludeId?: AppId,
): AppId | null {
  let best: WindowInstance | null = null;
  for (const w of Object.values(windows)) {
    if (w.id === excludeId || w.minimized) continue;
    if (!best || w.z > best.z) best = w;
  }
  return best ? best.id : null;
}

export const useWindowStore = create<WindowState>()(
  persist(
    (set) => ({
      windows: {},
      order: [],
      focusedId: null,
      topZ: Z_BASE,
      openCount: 0,

      openWindow: (id) =>
        set((state) => {
          const existing = state.windows[id];
          const topZ = state.topZ + 1;
          // Already open → focus it (and un-minimize if needed).
          if (existing) {
            return {
              windows: {
                ...state.windows,
                [id]: { ...existing, z: topZ, minimized: false },
              },
              focusedId: id,
              topZ,
            };
          }
          const { defaultSize } = getApp(id);
          const rect = initialRect(defaultSize, state.openCount, viewport());
          return {
            windows: {
              ...state.windows,
              [id]: {
                id,
                z: topZ,
                rect,
                minimized: false,
                maximized: false,
                restoreRect: null,
              },
            },
            order: [...state.order, id],
            focusedId: id,
            topZ,
            openCount: state.openCount + 1,
          };
        }),

      closeWindow: (id) =>
        set((state) => {
          if (!state.windows[id]) return state;
          const windows = { ...state.windows };
          delete windows[id];
          const order = state.order.filter((wid) => wid !== id);
          const focusedId =
            state.focusedId === id ? nextFocus(windows) : state.focusedId;
          return { windows, order, focusedId };
        }),

      closeAll: () => set({ windows: {}, order: [], focusedId: null }),

      focusWindow: (id) =>
        set((state) => {
          const existing = state.windows[id];
          if (!existing) return state;
          // Already top-most and focused → no-op (avoids unbounded z growth).
          if (state.focusedId === id && existing.z === state.topZ) return state;
          const topZ = state.topZ + 1;
          return {
            windows: { ...state.windows, [id]: { ...existing, z: topZ } },
            focusedId: id,
            topZ,
          };
        }),

      minimizeWindow: (id) =>
        set((state) => {
          const existing = state.windows[id];
          if (!existing) return state;
          const windows = {
            ...state.windows,
            [id]: { ...existing, minimized: true },
          };
          const focusedId =
            state.focusedId === id ? nextFocus(windows, id) : state.focusedId;
          return { windows, focusedId };
        }),

      restoreWindow: (id) =>
        set((state) => {
          const existing = state.windows[id];
          if (!existing) return state;
          const topZ = state.topZ + 1;
          return {
            windows: {
              ...state.windows,
              [id]: { ...existing, minimized: false, z: topZ },
            },
            focusedId: id,
            topZ,
          };
        }),

      toggleMaximize: (id) =>
        set((state) => {
          const existing = state.windows[id];
          if (!existing) return state;
          const topZ = state.topZ + 1;
          const next: WindowInstance = existing.maximized
            ? {
                ...existing,
                maximized: false,
                rect: existing.restoreRect
                  ? clampRect(existing.restoreRect, viewport())
                  : existing.rect,
                restoreRect: null,
                z: topZ,
              }
            : {
                ...existing,
                maximized: true,
                restoreRect: existing.rect,
                rect: maximizeRect(viewport()),
                z: topZ,
              };
          return {
            windows: { ...state.windows, [id]: next },
            focusedId: id,
            topZ,
          };
        }),

      moveWindow: (id, x, y) =>
        set((state) => {
          const existing = state.windows[id];
          if (!existing || existing.maximized) return state;
          const { x: cx, y: cy } = clampPosition(
            x,
            y,
            existing.rect,
            viewport(),
          );
          return {
            windows: {
              ...state.windows,
              [id]: { ...existing, rect: { ...existing.rect, x: cx, y: cy } },
            },
          };
        }),

      resizeWindow: (id, edge, origin, dx, dy) =>
        set((state) => {
          const existing = state.windows[id];
          if (!existing || existing.maximized) return state;
          const rect = resizeRect(origin, edge, dx, dy, viewport());
          return {
            windows: { ...state.windows, [id]: { ...existing, rect } },
          };
        }),
    }),
    {
      name: "douglasos:windows",
      version: 1,
      // Persist only the data; actions are recreated by the store factory.
      partialize: (state): PersistedWindowState => ({
        windows: state.windows,
        order: state.order,
        focusedId: state.focusedId,
        topZ: state.topZ,
        openCount: state.openCount,
      }),
      // Reconcile saved windows against the current viewport on load. Guard SSR:
      // `merge` can run without a window, in which case keep the default state.
      merge: (persisted, current) => {
        if (typeof window === "undefined") return current;
        return {
          ...current,
          ...reconcilePersisted(
            persisted as Partial<PersistedWindowState>,
            viewport(),
          ),
        };
      },
    },
  ),
);
