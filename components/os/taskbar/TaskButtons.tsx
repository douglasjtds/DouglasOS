"use client";

import { useTranslations } from "next-intl";
import { useWindowStore } from "@/lib/store/windowStore";
import { getApp, type AppId } from "@/lib/apps/registry";
import { taskButtonAction } from "@/lib/taskbar";
import { cn } from "@/lib/utils";

function focusWindowElement(id: AppId) {
  // preventScroll: on restore the window still sits at its minimized spot
  // (partly below the viewport); a plain focus() would scroll the shell.
  document.querySelector<HTMLElement>(`[data-window="${id}"]`)?.focus({ preventScroll: true });
}

function TaskButton({ id }: { id: AppId }) {
  const t = useTranslations("apps");
  const minimized = useWindowStore((s) => Boolean(s.windows[id]?.minimized));
  const focused = useWindowStore((s) => s.focusedId === id);
  const active = focused && !minimized;
  const Icon = getApp(id).icon;
  const title = t(`${id}.title`);

  function onClick() {
    const store = useWindowStore.getState();
    const win = store.windows[id];
    if (!win) return;
    const action = taskButtonAction(win, store.focusedId === id);
    if (action === "minimize") {
      store.minimizeWindow(id);
    } else {
      if (action === "restore") store.restoreWindow(id);
      else store.focusWindow(id);
      requestAnimationFrame(() => focusWindowElement(id));
    }
  }

  return (
    <li className="@container min-w-task-button-min max-w-task-button-max flex-1 max-md:w-touch-target max-md:min-w-touch-target max-md:flex-none">
      <button
        type="button"
        data-task-app={id}
        aria-pressed={active}
        title={title}
        onClick={onClick}
        className={cn(
          "flex h-task-button w-full items-center gap-1.5 rounded-button px-1.5 text-left text-system text-text-inverse focus-inverse max-md:justify-center max-md:px-0",
          active
            ? "bg-task-button-active shadow-task-button-active"
            : "bg-task-button-gradient shadow-[inset_-1px_-1px_var(--color-taskbar-shadow)] hover:bg-task-button-hover-gradient",
        )}
      >
        <span className="shrink-0">
          <Icon size={16} />
        </span>
        {/* Icon-only when the button gets crowded or on touch screens (the
            title stays as the accessible name / tooltip). */}
        <span className="truncate @max-[64px]:sr-only max-md:sr-only">{title}</span>
      </button>
    </li>
  );
}

/**
 * One button per open window, in opening order. On touch screens the buttons
 * are icon-only 44px targets and the list scrolls sideways inside the taskbar
 * (never the page) when many windows are open.
 */
export function TaskButtons() {
  const t = useTranslations("taskbar");
  const order = useWindowStore((s) => s.order);
  return (
    <ul
      aria-label={t("windows")}
      className="flex min-w-0 flex-1 items-center gap-1 px-1.5 max-md:overflow-x-auto max-md:overscroll-x-contain max-md:[scrollbar-width:none]"
    >
      {order.map((id) => (
        <TaskButton key={id} id={id} />
      ))}
    </ul>
  );
}
