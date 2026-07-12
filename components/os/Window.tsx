"use client";

import { Suspense, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useWindowStore } from "@/lib/store/windowStore";
import { getApp, type AppId } from "@/lib/apps/registry";
import { WindowChrome } from "@/components/os/window/WindowChrome";
import { ResizeHandles } from "@/components/os/window/ResizeHandles";
import { cn } from "@/lib/utils";

export function Window({ id }: { id: AppId }) {
  const instance = useWindowStore((s) => s.windows[id]);
  const isActive = useWindowStore((s) => s.focusedId === id);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const t = useTranslations("apps");

  const rootRef = useRef<HTMLElement>(null);
  const app = getApp(id);
  const Content = app.Content;

  // Move focus into the window when it opens (a11y); harmless if unmounted.
  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  if (!instance) return null;
  const { rect, z, minimized, maximized } = instance;

  return (
    <motion.section
      ref={rootRef}
      role="dialog"
      aria-label={t(`${id}.title`)}
      aria-hidden={minimized}
      tabIndex={-1}
      onPointerDown={() => focusWindow(id)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={
        minimized
          ? { opacity: 0, scale: 0.95, transition: { duration: 0.18, ease: "easeIn" } }
          : { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } }
      }
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18, ease: "easeIn" } }}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: z,
      }}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-window border bg-glass-window backdrop-blur-glass focus:outline-none",
        isActive
          ? "border-accent/25 shadow-window"
          : "border-white/[0.08] shadow-window-inactive",
        minimized && "pointer-events-none",
      )}
    >
      <WindowChrome id={id} />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <Suspense fallback={null}>
          <Content />
        </Suspense>
      </div>
      <ResizeHandles id={id} maximized={maximized} />
    </motion.section>
  );
}
