"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { useWindowStore } from "@/lib/store/windowStore";
import type { AppId } from "@/lib/apps/registry";
import { cn } from "@/lib/utils";

export type ControlGlyph = "minimize" | "maximize" | "restore" | "close";

/** White control glyphs drawn on a 21px canvas (own shapes). */
function Glyph({ glyph }: { glyph: ControlGlyph }) {
  return (
    <svg viewBox="0 0 21 21" className="size-full" aria-hidden focusable="false">
      {glyph === "minimize" && <rect x="5" y="13" width="7" height="3" fill="currentColor" />}
      {glyph === "maximize" && (
        <path d="M5 5h11v11H5zM7 8v6h7V8z" fill="currentColor" fillRule="evenodd" />
      )}
      {glyph === "restore" && (
        <path
          d="M8 4h9v9h-2v-5H8zM4 8h9v9H4zm2 3v4h5v-4z"
          fill="currentColor"
          fillRule="evenodd"
        />
      )}
      {glyph === "close" && (
        <path
          d="M6 6l9 9M15 6l-9 9"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="square"
        />
      )}
    </svg>
  );
}

/**
 * One XP title-bar control button (21px, white 1px border, glossy fill; the
 * close button is red). Also used by message boxes (close only). On touch
 * screens the token grows to 32px and an invisible ::after extends the hit
 * area to the 44px touch target.
 */
export function TitleBarButton({
  glyph,
  className,
  ...props
}: ComponentProps<"button"> & { glyph: ControlGlyph }) {
  const isClose = glyph === "close";
  return (
    <button
      type="button"
      className={cn(
        "relative flex size-control-button shrink-0 items-center justify-center rounded-control border border-control-border text-text-inverse focus-inverse",
        "max-md:after:absolute max-md:after:-inset-1.5 max-md:after:content-['']",
        isClose
          ? "bg-close-gradient hover:bg-close-hover-gradient active:bg-close-pressed active:bg-none"
          : "bg-control-gradient hover:bg-control-hover-gradient active:bg-control-pressed active:bg-none",
        className,
      )}
      {...props}
    >
      <Glyph glyph={glyph} />
    </button>
  );
}

/**
 * Minimize / Maximize-or-Restore / Close. `data-no-drag` keeps clicks from
 * dragging. `compact` (touch shell) drops Maximize/Restore: windows are always
 * full-screen there.
 */
export function WindowControls({
  id,
  active,
  compact = false,
}: {
  id: AppId;
  active: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("window");
  const maximized = useWindowStore((s) => Boolean(s.windows[id]?.maximized));
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);

  return (
    <div
      className={cn("flex items-center gap-0.5 max-md:gap-3", !active && "opacity-75")}
      data-no-drag
    >
      <TitleBarButton
        glyph="minimize"
        aria-label={t("minimize")}
        title={t("minimize")}
        onClick={() => minimizeWindow(id)}
      />
      {!compact && (
        <TitleBarButton
          glyph={maximized ? "restore" : "maximize"}
          aria-label={maximized ? t("restore") : t("maximize")}
          title={maximized ? t("restore") : t("maximize")}
          onClick={() => toggleMaximize(id)}
        />
      )}
      <TitleBarButton
        glyph="close"
        aria-label={t("close")}
        title={t("close")}
        onClick={() => closeWindow(id)}
      />
    </div>
  );
}
