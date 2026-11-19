"use client";

import type { KeyboardEvent, PointerEvent, RefObject } from "react";
import { useTranslations } from "next-intl";
import { launch } from "@/lib/apps/launch";
import {
  launcherTitleKey,
  type DesktopIconId,
  type LauncherConfig,
} from "@/lib/apps/registry";
import { cn } from "@/lib/utils";

/**
 * One desktop icon: 48px glyph + white shadowed label. A single click opens it
 * (DouglasOS decision, see DESKTOP-INTERFACE-SPEC §3); the press shows the blue
 * selection, and keyboard focus = selection + dotted rectangle. A press that
 * turned into a drag never opens (the `wasDragged` guard).
 */
export function DesktopIcon({
  launcher,
  selected,
  tabbable,
  wasDragged,
  onSelect,
  onKeyDown,
}: {
  launcher: LauncherConfig & { id: DesktopIconId };
  selected: boolean;
  tabbable: boolean;
  wasDragged?: RefObject<boolean>;
  onSelect: (id: DesktopIconId) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const t = useTranslations();
  const Icon = launcher.icon;
  const label = t(launcherTitleKey(launcher.id));

  function handleClick() {
    // A drag just ended on this icon — don't also open/download it.
    if (wasDragged?.current) return;
    launch(launcher.id);
  }

  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={tabbable ? 0 : -1}
      data-desktop-icon={launcher.id}
      title={launcher.kind === "download" ? t("resume.download") : undefined}
      onPointerDown={(e: PointerEvent) => {
        if (e.button === 0) onSelect(launcher.id);
      }}
      onFocus={() => onSelect(launcher.id)}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      className="group flex w-desktop-label cursor-default flex-col items-center gap-1 outline-none"
    >
      <span className={cn("size-icon-desktop", selected && "icon-selected-tint")}>
        <Icon size={48} />
      </span>
      <span
        className={cn(
          "max-w-desktop-label px-0.5 text-center text-system break-words",
          "group-focus-visible:outline group-focus-visible:outline-1 group-focus-visible:outline-dotted group-focus-visible:outline-focus-ring-inverse",
          selected
            ? "bg-highlight text-highlight-text"
            : "line-clamp-2 text-desktop-label text-shadow-desktop-label",
        )}
      >
        {label}
      </span>
    </div>
  );
}
