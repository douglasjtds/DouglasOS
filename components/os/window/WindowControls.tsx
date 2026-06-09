"use client";

import { useTranslations } from "next-intl";
import { useWindowStore } from "@/lib/store/windowStore";
import type { AppId } from "@/lib/apps/registry";
import { cn } from "@/lib/utils";

/** The three custom traffic-light controls. `data-no-drag` keeps the drag
 *  hook from starting a drag when these are clicked. */
export function WindowControls({ id }: { id: AppId }) {
  const t = useTranslations("window");
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);

  const controls = [
    {
      label: t("close"),
      onClick: () => closeWindow(id),
      className: "bg-win-close hover:bg-win-close-hover",
    },
    {
      label: t("minimize"),
      onClick: () => minimizeWindow(id),
      className: "bg-win-minimize hover:bg-win-minimize-hover",
    },
    {
      label: t("maximize"),
      onClick: () => toggleMaximize(id),
      className: "bg-win-maximize hover:bg-win-maximize-hover",
    },
  ];

  return (
    <div className="flex items-center gap-2" data-no-drag>
      {controls.map((c) => (
        <button
          key={c.label}
          type="button"
          aria-label={c.label}
          onClick={c.onClick}
          className={cn(
            "size-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-base-1",
            c.className,
          )}
        />
      ))}
    </div>
  );
}
