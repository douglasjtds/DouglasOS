"use client";

import { Suspense, useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useWindowStore } from "@/lib/store/windowStore";
import { getApp, type AppId } from "@/lib/apps/registry";
import { WindowChrome } from "@/components/os/window/WindowChrome";
import { ResizeHandles } from "@/components/os/window/ResizeHandles";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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

export function Window({ id }: { id: AppId }) {
  const instance = useWindowStore((s) => s.windows[id]);
  const isActive = useWindowStore((s) => s.focusedId === id);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const reduced = useReducedMotion();
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

  const target = minimized
    ? { opacity: 0, ...minimizeTransform(id, rect) }
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
      aria-hidden={minimized}
      inert={minimized}
      data-window={id}
      data-active={isActive}
      tabIndex={-1}
      onPointerDown={() => focusWindow(id)}
      initial={{ opacity: 0 }}
      animate={target}
      transition={transition}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: z,
        transformOrigin: "top left",
      }}
      className={cn(
        "pointer-events-auto absolute flex flex-col border-x-[3px] border-b-[3px] outline-none",
        !maximized && "rounded-t-window",
        isActive
          ? "border-window-frame bg-window-frame shadow-window"
          : "border-window-frame-inactive bg-window-frame-inactive shadow-window-inactive",
        minimized && "pointer-events-none",
      )}
    >
      <WindowChrome id={id} active={isActive} titleId={titleId} />
      <div className="flex min-h-0 flex-1 flex-col bg-button-face p-1">
        <div
          className={cn(
            "min-h-0 flex-1 overflow-auto text-body text-text",
            app.surface === "dialog"
              ? "p-2"
              : "border border-field-border bg-surface p-4",
          )}
        >
          <Suspense fallback={null}>
            <Content />
          </Suspense>
        </div>
      </div>
      <ResizeHandles id={id} maximized={maximized} />
    </motion.section>
  );
}
