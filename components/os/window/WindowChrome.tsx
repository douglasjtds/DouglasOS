"use client";

import { useTranslations } from "next-intl";
import { DropdownMenu } from "radix-ui";
import { useWindowStore } from "@/lib/store/windowStore";
import { useDrag } from "@/hooks/useDrag";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getApp, type AppId } from "@/lib/apps/registry";
import { WindowControls } from "@/components/os/window/WindowControls";
import { menuItemClass, menuSurfaceClass } from "@/components/os/menuStyles";
import { cn } from "@/lib/utils";

/** Click on the 16px title icon: Restore / Minimize / Maximize / Close. */
function WindowIconMenu({ id, titleId }: { id: AppId; titleId: string }) {
  const t = useTranslations("window");
  const maximized = useWindowStore((s) => Boolean(s.windows[id]?.maximized));
  const { minimizeWindow, toggleMaximize, closeWindow } = useWindowStore.getState();
  const Icon = getApp(id).icon;

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        data-no-drag
        aria-label={t("menu")}
        aria-describedby={titleId}
        className="flex size-icon-small shrink-0 items-center justify-center focus-inverse"
      >
        <Icon size={16} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className={cn(menuSurfaceClass, "z-1200 min-w-40")}
        >
          <DropdownMenu.Item
            className={menuItemClass}
            disabled={!maximized}
            onSelect={() => toggleMaximize(id)}
          >
            {t("restore")}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={menuItemClass} onSelect={() => minimizeWindow(id)}>
            {t("minimize")}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={menuItemClass}
            disabled={maximized}
            onSelect={() => toggleMaximize(id)}
          >
            {t("maximize")}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-0.5 h-px bg-bevel-shadow" />
          <DropdownMenu.Item
            className={cn(menuItemClass, "font-bold")}
            onSelect={() => closeWindow(id)}
          >
            {t("close")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/**
 * Luna title bar: app icon, bold title, and the three controls. The bar is the
 * drag handle; double-click toggles maximize. Inactive windows get the paler
 * bar with navy text (AA deviation, see DESIGN-GUIDELINES → Accessibility).
 *
 * Touch shell (< 768px): a compact bar (36px token) with a plain icon, the
 * title, and Minimize + Close only — windows are always full-screen there, so
 * there's nothing to drag, maximize or restore.
 */
export function WindowChrome({
  id,
  active,
  titleId,
}: {
  id: AppId;
  active: boolean;
  titleId: string;
}) {
  const t = useTranslations("apps");
  const maximized = useWindowStore((s) => Boolean(s.windows[id]?.maximized));
  const mobile = useIsMobile();
  const drag = useDrag(id, maximized || mobile);
  const Icon = getApp(id).icon;

  return (
    <div
      {...drag}
      data-titlebar
      onDoubleClick={(e) => {
        if (mobile || (e.target as HTMLElement).closest("[data-no-drag]")) return;
        useWindowStore.getState().toggleMaximize(id);
      }}
      className={cn(
        "flex h-titlebar shrink-0 select-none items-center gap-1.5 px-1.5 pt-0.5",
        !mobile && "touch-none",
        !maximized && !mobile && "rounded-t-window",
        active ? "bg-titlebar-gradient" : "bg-titlebar-inactive-gradient",
      )}
    >
      {mobile ? (
        <span aria-hidden className="flex size-icon-small shrink-0 items-center justify-center">
          <Icon size={16} />
        </span>
      ) : (
        <WindowIconMenu id={id} titleId={titleId} />
      )}
      <h2
        id={titleId}
        className={cn(
          "min-w-0 flex-1 truncate font-title text-title font-bold",
          active ? "text-titlebar-text" : "text-titlebar-text-inactive",
        )}
      >
        {t(`${id}.title`)}
      </h2>
      <WindowControls id={id} active={active} compact={mobile} />
    </div>
  );
}
