"use client";

import {
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  DESKTOP_ICON_GROUPS,
  DESKTOP_LAUNCHERS,
  getLauncher,
  type DesktopIconId,
  type LauncherConfig,
} from "@/lib/apps/registry";
import { launch } from "@/lib/apps/launch";
import { useDesktopStore, type DesktopItemId } from "@/lib/store/desktopStore";
import { useShellStore } from "@/lib/store/shellStore";
import {
  cellToPixel,
  iconsInGridOrder,
  iconsInRowOrder,
  mobileIconLayout,
  neighborIcon,
  type Cell,
  type Direction,
} from "@/lib/store/desktopGrid";
import { RECYCLE_BIN_ID, binCell, mobileBinPlacement } from "@/lib/store/recycleBin";
import { iconsInLasso, lassoRect, mergeSelections } from "@/lib/store/desktopSelection";
import type { Rect } from "@/lib/store/geometry";
import { DraggableIcon } from "@/components/os/desktop/DraggableIcon";
import { DesktopIcon } from "@/components/os/desktop/DesktopIcon";
import type { IconMenuItem } from "@/components/os/desktop/IconContextMenu";
import { Wallpaper } from "@/components/os/desktop/Wallpaper";
import { RecycleBinFullIcon } from "@/components/icons/RecycleBinIcons";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useElementWidth } from "@/hooks/useElementWidth";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRescuePhase } from "@/hooks/useRescuePhase";
import { useViewport } from "@/hooks/useViewport";
import { DURATION, EASE } from "@/lib/motion";

const ARROWS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Pixels of movement before a press on empty desktop becomes a lasso. */
const LASSO_THRESHOLD = 4;

const BIN_LAUNCHER = getLauncher(RECYCLE_BIN_ID) as LauncherConfig & { id: DesktopItemId };

function focusIcon(id: DesktopItemId) {
  document.querySelector<HTMLElement>(`[data-desktop-icon="${id}"]`)?.focus();
}

const isModified = (e: { ctrlKey: boolean; metaKey: boolean }) => e.ctrlKey || e.metaKey;

interface LassoSession {
  pointerId: number;
  start: { x: number; y: number };
  /** Selection kept underneath (Ctrl/Cmd+drag adds to it). */
  base: DesktopItemId[];
  active: boolean;
}

/**
 * Touch-layout slot of one icon: placed by the mobile grid, and plays the
 * rescue animation in place (shrink + fade out, fade back in) after a
 * long-press → Delete, since the bin may be scrolled out of view.
 */
function MobileIconSlot({
  id,
  position,
  children,
}: {
  id: DesktopIconId;
  position: { x: number; y: number };
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const rescue = useRescuePhase(id, reduced);
  return (
    <div role="none" className="absolute left-0 top-0" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
      <motion.div
        role="none"
        data-rescue={rescue.phase === "idle" ? undefined : rescue.phase}
        initial={false}
        animate={rescue.phase === "entering" ? { scale: 0.3, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={
          rescue.phase === "entering"
            ? { duration: DURATION.slow, ease: EASE.in }
            : rescue.phase === "returning"
              ? { duration: DURATION.slow, delay: 0.35 }
              : { duration: 0 }
        }
        onAnimationComplete={rescue.onAnimationComplete}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * The desktop work area: wallpaper + the icon grid + the Recycle Bin. The
 * icons form one multi-select listbox with a roving tab stop (one Tab stop
 * for the whole desktop):
 * - arrows move focus + selection across the grid (Ctrl/Cmd+arrows move focus
 *   only), Home/End jump to the ends, Enter opens, F2 shows the "protected
 *   file" joke instead of renaming;
 * - Space selects the focused icon, Ctrl/Cmd+Space toggles it, Ctrl/Cmd+A
 *   selects every icon (never the bin), Esc clears the selection, Delete
 *   "deletes" the selection (the Recycle Bin rescue joke, stage 6).
 * Pointer: a single click opens, Ctrl/Cmd+click toggles without opening, a
 * drag on empty desktop draws the lasso (Ctrl/Cmd adds to the selection),
 * dragging a selected icon moves the whole group, and dropping on the bin
 * triggers the rescue. Right-click / long-press opens the icon's menu (Open,
 * Delete).
 *
 * Below 768px (DESKTOP-INTERFACE-SPEC §11) the grid switches to the touch
 * layout: bigger cells filled row-first like a phone home screen, derived from
 * the container width (never persisted), no icon drag, no lasso, the bin on a
 * trailing row, and the container scrolls vertically if a short screen can't
 * fit every row.
 */
export function Desktop() {
  const t = useTranslations("desktop");
  const mobile = useIsMobile();
  const vp = useViewport();
  const savedCells = useDesktopStore((s) => s.iconCells);
  const selectedIds = useDesktopStore((s) => s.selectedIds);
  const binFull = useDesktopStore((s) => s.binFull);
  const overBin = useDesktopStore((s) => s.drag?.overBin ?? false);
  const openDialog = useShellStore((s) => s.openDialog);
  const [focusId, setFocusId] = useState<DesktopItemId | null>(null);
  const [lasso, setLasso] = useState<Rect | null>(null);
  const lassoSession = useRef<LassoSession | null>(null);
  // Focus that comes from a press must not re-select (Ctrl+click toggling off).
  const pointerFocus = useRef(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const surfaceWidth = useElementWidth(surfaceRef, vp.width);

  const mobileLayout = mobile ? mobileIconLayout(DESKTOP_ICON_GROUPS, surfaceWidth) : null;
  const mobileBin = mobileLayout ? mobileBinPlacement(mobileLayout, surfaceWidth) : null;
  const iconCells: Record<DesktopIconId, Cell> = mobileLayout?.cells ?? savedCells;
  const binAt = mobileBin?.cell ?? binCell(vp);
  const allCells = { ...iconCells, [RECYCLE_BIN_ID]: binAt } as Record<DesktopItemId, Cell>;
  const ordered = mobileLayout ? iconsInRowOrder(allCells) : iconsInGridOrder(allCells);
  const tabStop = focusId ?? selectedIds[0] ?? ordered[0];

  const store = () => useDesktopStore.getState();

  function deleteFrom(id: DesktopItemId) {
    const { selectedIds: selection, trashIcons } = store();
    trashIcons(selection.includes(id) ? selection : [id]);
  }

  function open(id: DesktopItemId) {
    store().select([id]);
    launch(id);
  }

  function menuFor(id: DesktopItemId): IconMenuItem[] {
    const items: IconMenuItem[] = [{ id: "open", label: t("menu.open"), primary: true, onSelect: () => open(id) }];
    if (id !== RECYCLE_BIN_ID) items.push({ id: "delete", label: t("menu.delete"), onSelect: () => deleteFrom(id) });
    return items;
  }

  function onPress(id: DesktopItemId, e: PointerEvent) {
    pointerFocus.current = true;
    requestAnimationFrame(() => {
      pointerFocus.current = false;
    });
    if (isModified(e)) {
      if (id !== RECYCLE_BIN_ID) store().toggleSelected(id);
      return;
    }
    // Pressing an icon of a multi-selection keeps the group (it may be dragged).
    if (!store().selectedIds.includes(id)) store().select([id]);
  }

  function onActivate(id: DesktopItemId, e: MouseEvent) {
    if (isModified(e)) return;
    open(id);
  }

  function onFocusIcon(id: DesktopItemId) {
    setFocusId(id);
    if (!pointerFocus.current && store().selectedIds.length === 0) store().select([id]);
  }

  function onIconKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const current = (e.currentTarget.dataset.desktopIcon ?? tabStop) as DesktopItemId;
    const mod = isModified(e);
    let next: DesktopItemId | null = null;
    if (e.key in ARROWS) next = neighborIcon(allCells, current, ARROWS[e.key]);
    else if (e.key === "Home") next = ordered[0];
    else if (e.key === "End") next = ordered[ordered.length - 1];
    else if (e.key === "Enter") {
      e.preventDefault();
      open(current);
      return;
    } else if (e.key === "F2") {
      e.preventDefault();
      openDialog({ kind: "protectedFile", iconId: current });
      return;
    } else if (e.key === " ") {
      e.preventDefault();
      if (mod && current !== RECYCLE_BIN_ID) store().toggleSelected(current);
      else store().select([current]);
      return;
    } else if ((e.key === "a" || e.key === "A") && mod && !e.altKey) {
      e.preventDefault();
      store().selectAll();
      return;
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteFrom(current);
      return;
    } else if (e.key === "Escape" && !mod && store().selectedIds.length > 0) {
      // Clears the selection first; Esc-closes-window waits for the next press.
      e.preventDefault();
      e.stopPropagation();
      store().clearSelection();
      return;
    } else {
      return;
    }
    e.preventDefault();
    if (next) {
      setFocusId(next);
      if (!mod) store().select([next]);
      focusIcon(next);
    }
  }

  function onSurfacePointerDown(e: PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (e.button !== 0 || (target !== e.currentTarget && !target.dataset.desktopSurface)) return;
    const mod = isModified(e);
    const base = mod ? store().selectedIds.filter((id) => id !== RECYCLE_BIN_ID) : [];
    if (!mod) store().clearSelection();
    if (mobile) return;
    lassoSession.current = { pointerId: e.pointerId, start: { x: e.clientX, y: e.clientY }, base, active: false };
  }

  function onSurfacePointerMove(e: PointerEvent<HTMLDivElement>) {
    const session = lassoSession.current;
    if (!session || e.pointerId !== session.pointerId) return;
    const point = { x: e.clientX, y: e.clientY };
    if (!session.active) {
      if (Math.hypot(point.x - session.start.x, point.y - session.start.y) <= LASSO_THRESHOLD) return;
      session.active = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const rect = lassoRect(session.start, point);
    setLasso(rect);
    store().select(mergeSelections(session.base, iconsInLasso(rect, savedCells, vp)));
  }

  function onSurfacePointerUp(e: PointerEvent<HTMLDivElement>) {
    const session = lassoSession.current;
    if (!session || e.pointerId !== session.pointerId) return;
    lassoSession.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setLasso(null);
  }

  const iconProps = (id: DesktopItemId) => ({
    selected: selectedIds.includes(id),
    tabbable: tabStop === id,
    menuItems: menuFor(id),
  });

  const binIcon = (
    <DesktopIcon
      launcher={BIN_LAUNCHER}
      glyph={binFull ? RecycleBinFullIcon : undefined}
      dropTarget={overBin}
      {...iconProps(RECYCLE_BIN_ID)}
      onPress={onPress}
      onActivate={onActivate}
      onFocusIcon={onFocusIcon}
      onKeyDown={onIconKeyDown}
    />
  );
  const binPos = mobileBin?.position ?? cellToPixel(binAt, vp);

  return (
    <div
      data-desktop
      data-layout={mobile ? "touch" : "pointer"}
      // select-none: a lasso drag must not leave a text selection behind (Firefox
      // would then start a native drag of it on the next icon press).
      className="absolute inset-x-0 top-0 bottom-taskbar z-0 select-none overflow-hidden"
      onPointerDown={onSurfacePointerDown}
      onPointerMove={onSurfacePointerMove}
      onPointerUp={onSurfacePointerUp}
      onPointerCancel={onSurfacePointerUp}
    >
      <Wallpaper />
      <div
        ref={surfaceRef}
        role="listbox"
        aria-label={t("label")}
        aria-multiselectable="true"
        aria-orientation={mobile ? "horizontal" : "vertical"}
        data-desktop-surface="true"
        className={
          mobile
            ? "absolute inset-0 z-10 overflow-y-auto overscroll-contain pt-safe-top px-safe"
            : "absolute inset-0 z-10"
        }
      >
        {mobileLayout && mobileBin ? (
          // Sized wrapper so the scroll height matches the icon grid.
          <div
            data-desktop-surface="true"
            className="relative"
            style={{ height: mobileBin.height }}
          >
            {DESKTOP_LAUNCHERS.map((launcher) => (
              <MobileIconSlot key={launcher.id} id={launcher.id} position={mobileLayout.positions[launcher.id]}>
                <DesktopIcon
                  launcher={launcher}
                  {...iconProps(launcher.id)}
                  onPress={onPress}
                  onActivate={onActivate}
                  onFocusIcon={onFocusIcon}
                  onKeyDown={onIconKeyDown}
                />
              </MobileIconSlot>
            ))}
            <div
              role="none"
              data-recycle-bin
              className="absolute left-0 top-0"
              style={{ transform: `translate(${binPos.x}px, ${binPos.y}px)` }}
            >
              {binIcon}
            </div>
          </div>
        ) : (
          <>
            {DESKTOP_LAUNCHERS.map((launcher) => (
              <DraggableIcon
                key={launcher.id}
                launcher={launcher}
                {...iconProps(launcher.id)}
                onPress={onPress}
                onActivate={onActivate}
                onFocusIcon={onFocusIcon}
                onKeyDown={onIconKeyDown}
              />
            ))}
            {/* Pinned (never dragged); under any icon flying over or into it. */}
            <div
              role="none"
              data-recycle-bin
              className="absolute left-0 top-0 z-0"
              style={{ transform: `translate(${binPos.x}px, ${binPos.y}px)` }}
            >
              {binIcon}
            </div>
            {lasso && (
              <div
                aria-hidden
                data-lasso
                className="pointer-events-none absolute z-3 border border-lasso-border bg-lasso-fill"
                style={{ left: lasso.x, top: lasso.y, width: lasso.width, height: lasso.height }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
