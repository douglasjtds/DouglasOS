"use client";

import { useTranslations } from "next-intl";
import { launch } from "@/lib/apps/launch";
import type { LauncherId } from "@/lib/apps/registry";
import { ContactIcon, ResumeIcon } from "@/components/icons/AppIcons";
import { Tooltip } from "@/components/ui/tooltip";
import type { IconComponent } from "@/components/icons/types";

const ITEMS: { id: LauncherId; labelKey: "quickCv" | "quickContact"; icon: IconComponent }[] = [
  { id: "resume", labelKey: "quickCv", icon: ResumeIcon },
  { id: "contact", labelKey: "quickContact", icon: ContactIcon },
];

/**
 * Quick Launch: the golden-rule shortcut — Download CV and Contact, one click
 * each, right next to Start. No other items belong here.
 */
export function QuickLaunch() {
  const t = useTranslations("taskbar");
  return (
    <div
      role="group"
      aria-label={t("quickLaunch")}
      className="flex h-full shrink-0 items-center gap-0.5 border-r border-taskbar-shadow px-1.5 shadow-[1px_0_var(--color-taskbar-highlight)] max-md:gap-0 max-md:px-0.5"
    >
      {ITEMS.map(({ id, labelKey, icon: Icon }) => (
        <Tooltip key={id} content={t(labelKey)}>
          <button
            type="button"
            aria-label={t(labelKey)}
            data-quick-launch={id}
            onClick={() => launch(id)}
            className="flex size-task-button items-center justify-center rounded-button hover:bg-task-button-hover hover:shadow-bevel-sunken active:bg-task-button-active focus-inverse max-md:size-touch-target"
          >
            <Icon size={16} />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
