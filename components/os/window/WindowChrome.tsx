"use client";

import { useTranslations } from "next-intl";
import { useWindowStore } from "@/lib/store/windowStore";
import { useDrag } from "@/hooks/useDrag";
import type { AppId } from "@/lib/apps/registry";
import { WindowControls } from "@/components/os/window/WindowControls";
import { cn } from "@/lib/utils";

/** Window top bar: control buttons + title. The whole bar is the drag handle. */
export function WindowChrome({ id }: { id: AppId }) {
  const t = useTranslations("apps");
  const maximized = useWindowStore((s) => Boolean(s.windows[id]?.maximized));
  const drag = useDrag(id, maximized);

  return (
    <div
      {...drag}
      onDoubleClick={() => useWindowStore.getState().toggleMaximize(id)}
      className={cn(
        "flex h-9 shrink-0 touch-none select-none items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-3",
        maximized ? "cursor-default" : "cursor-grab active:cursor-grabbing",
      )}
    >
      <WindowControls id={id} />
      <span className="truncate font-sans text-sm font-medium text-text-secondary">
        {t(`${id}.title`)}
      </span>
    </div>
  );
}
