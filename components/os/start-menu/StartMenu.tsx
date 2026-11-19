"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { DropdownMenu } from "radix-ui";
import { useShellStore } from "@/lib/store/shellStore";
import { launch } from "@/lib/apps/launch";
import {
  LAUNCHERS,
  getLauncher,
  launcherTitleKey,
  type LauncherId,
} from "@/lib/apps/registry";
import {
  AllProgramsIcon,
  DouglasOSLogo,
  HelpIcon,
  LogOffIcon,
  TurnOffIcon,
  UserAvatar,
} from "@/components/icons/SystemIcons";
import type { IconComponent } from "@/components/icons/types";
import { menuSurfaceClass } from "@/components/os/menuStyles";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

/** Pinned programs in the left column (CTA order from the interface spec). */
const PINNED: LauncherId[] = ["about", "projects", "how-i-work-with-ai", "contact"];

const itemBase =
  "flex cursor-default select-none items-center gap-2 outline-none data-[highlighted]:bg-startmenu-hover data-[highlighted]:text-text-inverse max-md:min-h-touch-target";

/** Move keyboard focus to the first item of a Start menu column. */
function focusColumn(column: "left" | "right") {
  document
    .querySelector<HTMLElement>(`[data-start-column="${column}"] [role="menuitem"]`)
    ?.focus();
}

/**
 * →/← cross between the two columns (arrows up/down are Radix's own roving
 * focus). Ignored when Radix already handled the key (submenus) or when the
 * event bubbled through React from a portalled submenu.
 */
function crossColumn(from: "left" | "right") {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented) return;
    if (!e.currentTarget.contains(e.target as Node)) return;
    if ((e.target as HTMLElement).hasAttribute("data-start-subtrigger")) return;
    if (from === "left" && e.key === "ArrowRight") {
      e.preventDefault();
      focusColumn("right");
    } else if (from === "right" && e.key === "ArrowLeft") {
      e.preventDefault();
      focusColumn("left");
    }
  };
}

function PlaceItem({
  icon: Icon,
  label,
  onSelect,
  testId,
  bold = true,
}: {
  icon: IconComponent;
  label: ReactNode;
  onSelect: () => void;
  testId: string;
  bold?: boolean;
}) {
  return (
    <DropdownMenu.Item
      data-start-item={testId}
      onSelect={onSelect}
      className={cn(itemBase, "px-1.5 py-1 text-startmenu-right-text", bold && "font-bold")}
    >
      <Icon size={24} />
      <span className="truncate">{label}</span>
    </DropdownMenu.Item>
  );
}

/**
 * Start button + Start menu (DESKTOP-INTERFACE-SPEC §5): user header, pinned
 * programs + All Programs on the left, places on the right, Log Off / Turn Off
 * in the footer. Radix DropdownMenu provides focus management, Esc, outside
 * click and type-ahead; the open state lives in the shell store so keyboard
 * shortcuts (Ctrl+Esc, Meta tap, Alt+Shift+S) can toggle it.
 *
 * Touch shell (< 768px, DESKTOP-INTERFACE-SPEC §11): a full-width panel up to
 * 85% of the screen height; the two columns stack (pinned programs, then
 * places) inside a scrolling body between the fixed header and footer, every
 * item is a 44px target, and All Programs is an inline list instead of a
 * cascading submenu (no room to cascade on a phone).
 */
export function StartMenu() {
  const t = useTranslations();
  const open = useShellStore((s) => s.startMenuOpen);
  const setOpen = useShellStore((s) => s.setStartMenuOpen);
  const logOff = useShellStore((s) => s.logOff);
  const openDialog = useShellStore((s) => s.openDialog);
  // When an item hands focus elsewhere (a new window, a dialog), don't let the
  // menu pull it back to the Start button on close.
  const keepFocus = useRef(false);

  /** Item handler (only ever called from Radix `onSelect`, never in render). */
  function select(action: () => void, movesFocus = true) {
    keepFocus.current = movesFocus;
    action();
  }

  const label = (id: LauncherId) => t(launcherTitleKey(id));
  const mobile = useIsMobile();

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger
        data-start-button
        aria-label={t("taskbar.startLabel")}
        className={cn(
          "group flex h-full shrink-0 items-center gap-1 rounded-start pl-2 pr-5 focus-inverse",
          "bg-start-gradient hover:bg-start-hover-gradient data-[state=open]:bg-start-pressed-gradient",
          "shadow-[inset_-1px_0_var(--color-start-shadow)]",
        )}
      >
        <DouglasOSLogo size={20} />
        <span className="text-start italic text-text-inverse text-shadow-start-label">
          {t("taskbar.start")}
        </span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          data-start-menu
          aria-label={t("startMenu.label")}
          // Radix labels the menu by its trigger ("Start"); use the fuller name.
          aria-labelledby={undefined}
          side="top"
          align="start"
          sideOffset={0}
          avoidCollisions={false}
          onCloseAutoFocus={(e) => {
            if (keepFocus.current) e.preventDefault();
            keepFocus.current = false;
          }}
          className={cn(
            "z-1200 flex w-startmenu-w flex-col text-system overflow-hidden rounded-t-startmenu border border-startmenu-frame bg-startmenu-header shadow-menu outline-none",
            "max-md:max-h-[min(85dvh,var(--radix-dropdown-menu-content-available-height))] max-md:w-screen max-md:border-x-0",
          )}
        >
          {/* Header: avatar + user name */}
          <div className="flex h-startmenu-header shrink-0 items-center gap-2 bg-startmenu-header-gradient px-2">
            <span className="rounded-button border-2 border-surface/80 shadow-menu">
              <UserAvatar size={44} />
            </span>
            <span className="text-startmenu-user text-text-inverse text-shadow-start-label">
              {t("startMenu.user")}
            </span>
          </div>
          <div aria-hidden className="h-0.5 shrink-0 bg-startmenu-accent-gradient" />

          <div
            data-start-body
            className="grid grid-cols-2 bg-startmenu-left max-md:min-h-0 max-md:grid-cols-1 max-md:overflow-y-auto max-md:overscroll-contain"
          >
            {/* Left column: pinned programs + All Programs */}
            <div
              data-start-column="left"
              onKeyDown={crossColumn("left")}
              // Touch: `contents` lets pinned / places / All Programs stack in
              // that order inside the single scrolling column.
              className="flex flex-col gap-0.5 p-1.5 max-md:contents"
            >
              <DropdownMenu.Group
                aria-label={t("startMenu.pinned")}
                className="flex flex-col gap-0.5 max-md:order-1 max-md:p-1.5"
              >
                {PINNED.map((id) => {
                  const Icon = getLauncher(id).icon;
                  return (
                    <DropdownMenu.Item
                      key={id}
                      data-start-item={id}
                      onSelect={() => select(() => launch(id))}
                      className={cn(itemBase, "group/item px-1 py-1 text-text")}
                    >
                      <Icon size={32} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-bold">{label(id)}</span>
                        <span className="truncate text-text-muted group-data-[highlighted]/item:text-text-inverse">
                          {t(`apps.${id}.description`)}
                        </span>
                      </span>
                    </DropdownMenu.Item>
                  );
                })}
              </DropdownMenu.Group>

              <div className="flex-1 max-md:hidden" />
              <DropdownMenu.Separator className="mx-1 my-1 h-px bg-startmenu-accent-gradient max-md:hidden" />

              {mobile ? (
                <DropdownMenu.Group
                  aria-label={t("startMenu.allPrograms")}
                  data-all-programs
                  className="flex flex-col p-1.5 max-md:order-3"
                >
                  <DropdownMenu.Label className="flex min-h-touch-target items-center justify-center gap-2 px-1 font-bold text-text">
                    {t("startMenu.allPrograms")}
                    <AllProgramsIcon size={18} />
                  </DropdownMenu.Label>
                  {LAUNCHERS.map((l) => (
                    <DropdownMenu.Item
                      key={l.id}
                      data-program={l.id}
                      onSelect={() => select(() => launch(l.id), l.kind === "window")}
                      className={cn(itemBase, "px-2 text-text")}
                    >
                      <l.icon size={16} />
                      {label(l.id)}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Group>
              ) : (
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger
                  data-start-subtrigger
                  data-start-item="all-programs"
                  className={cn(itemBase, "justify-center gap-2 px-1 py-1 font-bold text-text")}
                >
                  {t("startMenu.allPrograms")}
                  <AllProgramsIcon size={18} />
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent
                    data-all-programs
                    sideOffset={2}
                    className={cn(menuSurfaceClass, "z-1200 min-w-52")}
                  >
                    {LAUNCHERS.map((l) => (
                      <DropdownMenu.Item
                        key={l.id}
                        data-program={l.id}
                        onSelect={() => select(() => launch(l.id), l.kind === "window")}
                        className={cn(itemBase, "h-menu-item px-2")}
                      >
                        <l.icon size={16} />
                        {label(l.id)}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
              )}
            </div>

            {/* Right column: places */}
            <div
              data-start-column="right"
              onKeyDown={crossColumn("right")}
              className="flex flex-col gap-0.5 border-l border-startmenu-right-border bg-startmenu-right p-1.5 max-md:order-2 max-md:border-y max-md:border-l-0"
            >
              <PlaceItem
                testId="my-projects"
                icon={getLauncher("projects").icon}
                label={t("startMenu.myProjects")}
                onSelect={() => select(() => launch("projects"))}
              />
              <PlaceItem
                testId="resume"
                icon={getLauncher("resume").icon}
                label={t("startMenu.resume")}
                onSelect={() => select(() => launch("resume"), false)}
              />
              <PlaceItem
                testId="contact"
                icon={getLauncher("contact").icon}
                label={t("startMenu.contact")}
                onSelect={() => select(() => launch("contact"))}
              />
              <DropdownMenu.Separator className="mx-1 my-1 h-px bg-startmenu-right-border" />
              <PlaceItem
                testId="display"
                bold={false}
                icon={getLauncher("display").icon}
                label={t("startMenu.displayProperties")}
                onSelect={() => select(() => launch("display"))}
              />
              <PlaceItem
                testId="help"
                bold={false}
                icon={HelpIcon}
                label={t("startMenu.help")}
                onSelect={() => select(() => launch("about"))}
              />
            </div>
          </div>

          {/* Footer: Log Off / Turn Off */}
          <div className="flex shrink-0 items-center justify-end gap-1 bg-startmenu-header-gradient px-2 py-1">
            <DropdownMenu.Item
              data-start-item="log-off"
              onSelect={() => select(logOff)}
              className={cn(itemBase, "rounded-button px-1.5 py-0.5 text-text-inverse")}
            >
              <LogOffIcon size={22} />
              {t("startMenu.logOff")}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              data-start-item="turn-off"
              onSelect={() => select(() => openDialog({ kind: "turnOff" }))}
              className={cn(itemBase, "rounded-button px-1.5 py-0.5 text-text-inverse")}
            >
              <TurnOffIcon size={22} />
              {t("startMenu.turnOff")}
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
