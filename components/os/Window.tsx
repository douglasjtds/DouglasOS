"use client";

import { Suspense, useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useWindowStore } from "@/lib/store/windowStore";
import { getApp, type AppId } from "@/lib/apps/registry";
import { WindowChrome } from "@/components/os/window/WindowChrome";
import { ResizeHandles } from "@/components/os/window/ResizeHandles";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DURATION, EASE } from "@/lib/motion";
import type { Rect } from "@/lib/store/geometry";
import { cn } from "@/lib/utils";

/**
 * Transform that shrinks a window onto its taskbar button (the minimize
 * target). Falls back to a short drop toward the taskbar if the button can't
 * be measured.
 */
function minimizeTransform(id: AppId, rect: Rect) {
  const button = document.querySelector<HTMLElement>(`[data-task-app="${id}"]`);
  if (!button) return { x: 0, y: 40, scale: 0.9 };
  const b = button.getBoundingClientRect();
  return {
    x: b.left - rect.x,
    y: b.top - rect.y,
    scale: Math.max(0.05, b.width / rect.width),
  };
}

/**
 * One app window. On the desktop it's a free Luna window (drag, resize,
 * minimize tween). Below 768px (DESKTOP-INTERFACE-SPEC §11) the same store
 * state is *presented* differently: every window fills the work area, has no
 * drag/resize, and only the focused one is visible — the others stay mounted
 * but hidden and inert until picked from the taskbar. The stored rect is left
 * untouched, so rotating to a wide screen restores the desktop geometry.
 */
export function Window({ id }: { id: AppId }) {
  const instance = useWindowStore((s) => s.windows[id]);
  const isActive = useWindowStore((s) => s.focusedId === id);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const titleId = useId();

  const rootRef = useRef<HTMLElement>(null);
  const app = getApp(id);
  const Content = app.Content;

  // Move focus into the window when it opens (a11y); harmless if unmounted.
  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  const minimized = instance?.minimized ?? false;
  // Once a window has been minimized, un-minimizing is a "restore" (reverse
  // tween, duration-base) rather than the first-open fade (duration-fast).
  // Derived during render — React's "adjust state on prop change" pattern.
  const [everMinimized, setEverMinimized] = useState(minimized);
  if (minimized && !everMinimized) setEverMinimized(true);

  if (!instance) return null;
  const { rect, z, maximized } = instance;
  // Touch shell: one full-screen window at a time.
  const hidden = minimized || (mobile && !isActive);

  const target = minimized
    ? { opacity: 0, ...(mobile ? {} : minimizeTransform(id, rect)) }
    : mobile && !isActive
      ? { opacity: 0, x: 0, y: 0, scale: 1 }
      : { opacity: 1, x: 0, y: 0, scale: 1 };
  const transition = reduced
    ? { duration: DURATION.instant }
    : minimized
      ? { duration: DURATION.base, ease: EASE.in }
      : {
          duration: everMinimized ? DURATION.base : DURATION.fast,
          ease: EASE.out,
        };

  return (
    <motion.section
      ref={rootRef}
      aria-labelledby={titleId}
      aria-hidden={hidden}
      inert={hidden}
      data-window={id}
      data-active={isActive}
      data-presentation={mobile ? "fullscreen" : "floating"}
      tabIndex={-1}
      onPointerDown={() => focusWindow(id)}
      initial={{ opacity: 0 }}
      animate={target}
      transition={transition}
      style={
        mobile
          ? { left: 0, top: 0, width: "100%", height: "100%", zIndex: z }
          : {
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              zIndex: z,
              transformOrigin: "top left",
            }
      }
      className={cn(
        "pointer-events-auto absolute flex flex-col outline-none",
        mobile ? "pt-safe-top px-safe" : "border-x-[3px] border-b-[3px]",
        !maximized && !mobile && "rounded-t-window",
        isActive
          ? "border-window-frame bg-window-frame shadow-window"
          : "border-window-frame-inactive bg-window-frame-inactive shadow-window-inactive",
        hidden && "pointer-events-none",
      )}
    >
      <WindowChrome id={id} active={isActive} titleId={titleId} />
      {app.surface === "bare" ? (
        // The app draws its own bars and content pane (DouglasOS Explorer).
        <div className="flex min-h-0 flex-1 flex-col bg-button-face text-body text-text">
          <Suspense fallback={null}>
            <Content />
          </Suspense>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col bg-button-face p-1 max-md:p-0.5">
          <div
            className={cn(
              "min-h-0 flex-1 overflow-auto overscroll-contain text-body text-text",
              app.surface === "dialog"
                ? "p-2"
                : "border border-field-border bg-surface p-4 max-md:p-3",
            )}
          >
            <Suspense fallback={null}>
              <Content />
            </Suspense>
          </div>
        </div>
      )}
      {!mobile && <ResizeHandles id={id} maximized={maximized} />}
    </motion.section>
  );
}
