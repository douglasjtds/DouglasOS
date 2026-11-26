"use client";

import type { FormEvent, KeyboardEvent, ReactNode, Ref } from "react";
import { useTranslations } from "next-intl";
import { DropdownMenu, Menubar } from "radix-ui";
import { MoreHorizontal } from "lucide-react";
import { PROJECTS, PROJECTS_HOME_ROUTE } from "@/lib/content/projects";
import { menuItemClass, menuSurfaceClass } from "@/components/os/menuStyles";
import {
  CaseStudyIcon,
  NavBackIcon,
  NavForwardIcon,
  NavHomeIcon,
} from "@/components/icons/BrowserIcons";
import { DouglasOSLogo } from "@/components/icons/SystemIcons";
import { ContactIcon, ProjectsIcon, ResumeIcon } from "@/components/icons/AppIcons";
import type { IconComponent } from "@/components/icons/types";
import { cn } from "@/lib/utils";

/** What the Explorer's menus and buttons can ask the app to do. */
export interface ExplorerActions {
  go: (route: string) => void;
  contact: () => void;
  downloadCv: () => void;
  close: () => void;
}

const menuTriggerClass =
  "flex h-full items-center px-1.5 text-system text-text outline-none data-[highlighted]:bg-highlight data-[highlighted]:text-highlight-text data-[state=open]:bg-highlight data-[state=open]:text-highlight-text";

/**
 * Menu items shared by the desktop menu bar and the touch "More" menu.
 * `Item`/`Separator` are the Menubar or DropdownMenu parts.
 */
function FileItems({
  actions,
  Item,
}: {
  actions: ExplorerActions;
  Item: typeof Menubar.Item | typeof DropdownMenu.Item;
}) {
  const t = useTranslations("apps.projects.explorer.menu");
  const entry = (icon: IconComponent, label: string, onSelect: () => void, testId: string) => {
    const Icon = icon;
    return (
      <Item data-explorer-menu-item={testId} className={cn(menuItemClass, "max-md:min-h-touch-target")} onSelect={onSelect}>
        <Icon size={16} />
        {label}
      </Item>
    );
  };
  return (
    <>
      {entry(NavHomeIcon, t("home"), () => actions.go(PROJECTS_HOME_ROUTE), "home")}
      {entry(ContactIcon, t("contact"), actions.contact, "contact")}
      {entry(ResumeIcon, t("downloadCv"), actions.downloadCv, "cv")}
    </>
  );
}

function FavoriteItems({
  actions,
  Item,
}: {
  actions: ExplorerActions;
  Item: typeof Menubar.Item | typeof DropdownMenu.Item;
}) {
  return (
    <>
      {PROJECTS.map((p) => (
        <Item
          key={p.slug}
          data-explorer-favorite={p.slug}
          className={cn(menuItemClass, "max-md:min-h-touch-target")}
          onSelect={() => actions.go(p.slug)}
        >
          <CaseStudyIcon size={16} />
          {p.name}
        </Item>
      ))}
    </>
  );
}

/** Desktop menu bar: File and Favorites only (never fake menus), plus the brand tile. */
export function ExplorerMenuBar({ actions }: { actions: ExplorerActions }) {
  const t = useTranslations("apps.projects.explorer");
  const content = cn(menuSurfaceClass, "z-1200 min-w-48");
  return (
    <div className="flex h-menubar shrink-0 items-stretch border-b border-bevel-shadow">
      <Menubar.Root aria-label={t("menuBar")} className="flex items-stretch">
        <Menubar.Menu>
          <Menubar.Trigger data-explorer-menu="file" className={menuTriggerClass}>
            {t("menu.file")}
          </Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content align="start" className={content}>
              <FileItems actions={actions} Item={Menubar.Item} />
              <Menubar.Separator className="my-0.5 h-px bg-bevel-shadow" />
              <Menubar.Item className={menuItemClass} onSelect={actions.close}>
                {t("menu.close")}
              </Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
        <Menubar.Menu>
          <Menubar.Trigger data-explorer-menu="favorites" className={menuTriggerClass}>
            {t("menu.favorites")}
          </Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content align="start" className={content}>
              <FavoriteItems actions={actions} Item={Menubar.Item} />
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
      </Menubar.Root>
      <span className="flex-1" />
      {/* Brand tile at the right end of the menu bar. */}
      <span aria-hidden className="flex w-8 items-center justify-center border-l border-bevel-shadow bg-surface">
        <DouglasOSLogo size={16} />
      </span>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  showLabel,
  disabled,
  onClick,
  nav,
}: {
  icon: IconComponent;
  label: string;
  showLabel?: boolean;
  disabled?: boolean;
  onClick: () => void;
  nav: string;
}) {
  return (
    <button
      type="button"
      data-explorer-nav={nav}
      aria-label={showLabel ? undefined : label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 rounded-button px-1 text-system text-text focus-light",
        "hover:shadow-bevel-raised active:shadow-bevel-pressed",
        "disabled:pointer-events-none disabled:text-text-disabled disabled:[&_svg]:opacity-40 disabled:[&_svg]:grayscale",
        "max-md:h-touch-target max-md:min-w-touch-target max-md:justify-center",
      )}
    >
      <Icon size={24} />
      {showLabel && <span className="pr-1 max-md:sr-only">{label}</span>}
    </button>
  );
}

/** Touch "More" menu: the File and Favorites items in one dropdown. */
function MobileMoreMenu({ actions }: { actions: ExplorerActions }) {
  const t = useTranslations("apps.projects.explorer");
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        data-explorer-more
        aria-label={t("menu.more")}
        className="flex size-touch-target shrink-0 items-center justify-center rounded-button text-text focus-light"
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={2} className={cn(menuSurfaceClass, "z-1200 min-w-56")}>
          <DropdownMenu.Label className="px-2 py-1 font-bold">{t("menu.favorites")}</DropdownMenu.Label>
          <FavoriteItems actions={actions} Item={DropdownMenu.Item} />
          <DropdownMenu.Separator className="my-0.5 h-px bg-bevel-shadow" />
          <FileItems actions={actions} Item={DropdownMenu.Item} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/**
 * Toolbar (Back / Forward / Home) and the address bar. Desktop: two rows like
 * the classic browser. Touch (< 768px): one compact row, icon-only 44px
 * buttons, the address field and a "More" menu; the keyboard's Go key submits.
 */
export function ExplorerToolbar({
  mobile,
  canBack,
  canForward,
  onBack,
  onForward,
  onHome,
  address,
  onAddressChange,
  onSubmit,
  onEscape,
  inputRef,
  actions,
}: {
  mobile: boolean;
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  address: string;
  onAddressChange: (value: string) => void;
  onSubmit: () => void;
  onEscape: () => void;
  inputRef: Ref<HTMLInputElement>;
  actions: ExplorerActions;
}) {
  const t = useTranslations("apps.projects.explorer");

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }
  function keyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onEscape();
    }
  }

  const nav: ReactNode = (
    <div role="group" aria-label={t("toolbar.label")} className="flex items-center gap-0.5">
      <ToolbarButton nav="back" icon={NavBackIcon} label={t("toolbar.back")} showLabel disabled={!canBack} onClick={onBack} />
      <ToolbarButton nav="forward" icon={NavForwardIcon} label={t("toolbar.forward")} disabled={!canForward} onClick={onForward} />
      <ToolbarButton nav="home" icon={NavHomeIcon} label={t("toolbar.home")} onClick={onHome} />
    </div>
  );

  const field = (
    <form role="search" onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-1.5">
      <label
        htmlFor="explorer-address"
        className={cn("shrink-0 text-system text-text-muted", mobile && "sr-only")}
      >
        {t("address")}
      </label>
      <div className="flex h-push-button-h min-w-0 flex-1 items-center gap-1 border border-field-border bg-surface pl-1 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-focus-ring max-md:h-touch-target">
        <ProjectsIcon size={16} />
        <input
          id="explorer-address"
          ref={inputRef}
          data-explorer-address
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          onKeyDown={keyDown}
          onFocus={(e) => e.currentTarget.select()}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          className="h-full min-w-0 flex-1 bg-transparent font-mono text-system text-text outline-none max-md:text-heading max-md:font-normal"
        />
      </div>
      {!mobile && (
        <button
          type="submit"
          className="flex h-push-button-h shrink-0 items-center gap-1 rounded-button px-1.5 text-system text-text hover:shadow-bevel-raised active:shadow-bevel-pressed focus-light"
        >
          <NavForwardIcon size={16} />
          {t("go")}
        </button>
      )}
    </form>
  );

  if (mobile) {
    return (
      <div className="flex shrink-0 items-center gap-0.5 border-b border-bevel-shadow px-0.5 py-0.5">
        {nav}
        {field}
        <MobileMoreMenu actions={actions} />
      </div>
    );
  }
  return (
    <>
      <div className="flex shrink-0 items-center border-b border-bevel-shadow px-1 py-0.5">{nav}</div>
      <div className="flex shrink-0 items-center border-b border-bevel-shadow px-1.5 py-1">{field}</div>
    </>
  );
}

/** Status bar: "Done" on the left, the browser's name on the right. */
export function ExplorerStatusBar() {
  const t = useTranslations("apps.projects.explorer");
  return (
    <div className="flex h-statusbar shrink-0 items-stretch gap-0.5 p-0.5 text-system text-text">
      <span data-explorer-status className="flex flex-1 items-center gap-1 px-1.5 shadow-bevel-sunken">
        <CaseStudyIcon size={16} />
        {t("status.done")}
      </span>
      <span className="flex items-center gap-1 px-1.5 shadow-bevel-sunken">
        <DouglasOSLogo size={14} />
        {t("name")}
      </span>
    </div>
  );
}
