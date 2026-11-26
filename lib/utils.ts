import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge only knows Tailwind's default scale, so custom token
 * utilities would be misclassified (e.g. `text-system` read as a *color* and
 * dropped next to `text-text`). Register the DouglasOS tokens from
 * app/globals.css so merging stays correct.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "system",
        "title",
        "start",
        "startmenu-user",
        "body",
        "heading",
        "heading-lg",
        "logon",
        "boot",
      ],
      font: ["title"],
      spacing: [
        "taskbar",
        "titlebar",
        "menubar",
        "statusbar",
        "menu-item",
        "control-button",
        "start-button",
        "task-button",
        "task-button-min",
        "task-button-max",
        "icon-desktop",
        "icon-startmenu-pinned",
        "icon-startmenu-places",
        "icon-small",
        "desktop-cell-x",
        "desktop-cell-y",
        "desktop-label",
        "startmenu-w",
        "startmenu-header",
        "avatar-startmenu",
        "push-button-w",
        "push-button-h",
        "touch-target",
      ],
      radius: [
        "window",
        "start",
        "startmenu",
        "control",
        "button",
        "groupbox",
        "balloon",
      ],
      shadow: [
        "bevel-raised",
        "bevel-pressed",
        "bevel-sunken",
        "button-hover",
        "button-default",
        "task-button-active",
        "window",
        "window-inactive",
        "menu",
        "balloon",
      ],
      "text-shadow": ["desktop-label", "start-label"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
