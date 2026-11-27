"use client";

import type { FormEvent, KeyboardEvent, Ref } from "react";
import { useTranslations } from "next-intl";
import { DropdownMenu, Menubar } from "radix-ui";
import { ExternalLink, MoreHorizontal, Plus, RotateCw, X } from "lucide-react";
import { BROWSER_SITES, type BrowserSiteId } from "@/lib/browser/sites";
import { menuItemClass, menuSurfaceClass } from "@/components/os/menuStyles";
import { BrowserAppIcon, NavBackIcon, NavForwardIcon, NavHomeIcon } from "@/components/icons/BrowserIcons";
import { DouglasOSLogo } from "@/components/icons/SystemIcons";
import { ContactIcon, ResumeIcon } from "@/components/icons/AppIcons";
import type { IconComponent } from "@/components/icons/types";
import { cn } from "@/lib/utils";

/** What the browser's menus and buttons can ask the app to do. */
export interface BrowserActions {
  open: (siteId: BrowserSiteId) => void;
  newTab: () => void;
  closeTab: () => void;
  openReal: (() => void) | null;
  downloadCv: () => void;
  contact: () => void;
  close: () => void;
}

type MenuItem = typeof Menubar.Item | typeof DropdownMenu.Item;

const menuTriggerClass =
  "flex h-full items-center px-1.5 text-system text-text outline-none data-[highlighted]:bg-highlight data-[highlighted]:text-highlight-text data-[state=open]:bg-highlight data-[state=open]:text-highlight-text";
const itemClass = cn(menuItemClass, "max-md:min-h-touch-target");

function FileItems({ actions, Item }: { actions: BrowserActions; Item: MenuItem }) {
  const t = useTranslations("apps.browser.menu");
  const entry = (icon: IconComponent, label: string, onSelect: () => void, key: string) => {
    const Icon = icon;
    return (
      <Item data-browser-menu-item={key} className={itemClass} onSelect={onSelect}>
        <Icon size={16} />
        {label}
      </Item>
    );
  };
  return (
    <>
      {entry(BrowserAppIcon, t("newTab"), actions.newTab, "new-tab")}
      {entry(BrowserAppIcon, t("closeTab"), actions.closeTab, "close-tab")}
      {actions.openReal && (
        <Item data-browser-menu-item="open-real" className={itemClass} onSelect={actions.openReal}>
          <ExternalLink className="size-4" aria-hidden />
          {t("openReal")}
        </Item>
      )}
      {entry(ResumeIcon, t("downloadCv"), actions.downloadCv, "cv")}
      {entry(ContactIcon, t("contact"), actions.contact, "contact")}
    </>
  );
}

function FavoriteItems({ actions, Item }: { actions: BrowserActions; Item: MenuItem }) {
  return (
    <>
      {BROWSER_SITES.map((site) => (
        <Item
          key={site.id}
          data-browser-favorite={site.id}
          className={itemClass}
          onSelect={() => actions.open(site.id)}
        >
          <BrowserAppIcon size={16} />
          {site.title}
        </Item>
      ))}
    </>
  );
}

/** Desktop menu bar: File and Favorites only (never fake menus), plus the brand tile. */
export function BrowserMenuBar({ actions }: { actions: BrowserActions }) {
  const t = useTranslations("apps.browser");
  const content = cn(menuSurfaceClass, "z-1200 min-w-48");
  return (
    <div className="flex h-menubar shrink-0 items-stretch border-b border-bevel-shadow">
      <Menubar.Root aria-label={t("menuBar")} className="flex items-stretch">
        <Menubar.Menu>
          <Menubar.Trigger data-browser-menu="file" className={menuTriggerClass}>
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
          <Menubar.Trigger data-browser-menu="favorites" className={menuTriggerClass}>
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
      <span aria-hidden className="flex w-8 items-center justify-center border-l border-bevel-shadow bg-surface">
        <DouglasOSLogo size={16} />
      </span>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  showLabel,
  disabled,
  onClick,
  nav,
}: {
  icon: IconComponent | "refresh" | "external";
  label: string;
  showLabel?: boolean;
  disabled?: boolean;
  onClick: () => void;
  nav: string;
}) {
  const Icon = typeof icon === "string" ? null : icon;
  return (
    <button
      type="button"
      data-browser-nav={nav}
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
      {Icon && <Icon size={24} />}
      {icon === "refresh" && <RotateCw className="size-5 text-highlight" aria-hidden />}
      {icon === "external" && <ExternalLink className="size-5 text-highlight" aria-hidden />}
      {showLabel && <span className="pr-1 max-md:sr-only">{label}</span>}
    </button>
  );
}

/** Touch "More" menu: Favorites and File items in one dropdown. */
function MobileMoreMenu({ actions }: { actions: BrowserActions }) {
  const t = useTranslations("apps.browser.menu");
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        data-browser-more
        aria-label={t("more")}
        className="flex size-touch-target shrink-0 items-center justify-center rounded-button text-text focus-light"
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={2} className={cn(menuSurfaceClass, "z-1200 min-w-56")}>
          <DropdownMenu.Label className="px-2 py-1 font-bold">{t("favorites")}</DropdownMenu.Label>
          <FavoriteItems actions={actions} Item={DropdownMenu.Item} />
          <DropdownMenu.Separator className="my-0.5 h-px bg-bevel-shadow" />
          <FileItems actions={actions} Item={DropdownMenu.Item} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/**
 * Toolbar (Back / Forward / Refresh / Home / real tab) and the address bar.
 * Desktop: two rows like the classic browser. Touch: one compact row with
 * icon-only 44px buttons, the address field and a "More" menu.
 */
export function BrowserToolbar({
  mobile,
  canBack,
  canForward,
  onBack,
  onForward,
  onRefresh,
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
  onRefresh: () => void;
  onHome: () => void;
  address: string;
  onAddressChange: (value: string) => void;
  onSubmit: () => void;
  onEscape: () => void;
  inputRef: Ref<HTMLInputElement>;
  actions: BrowserActions;
}) {
  const t = useTranslations("apps.browser");

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

  const nav = (
    <div role="group" aria-label={t("toolbar.label")} className="flex items-center gap-0.5">
      <ToolbarButton nav="back" icon={NavBackIcon} label={t("toolbar.back")} showLabel={!mobile} disabled={!canBack} onClick={onBack} />
      <ToolbarButton nav="forward" icon={NavForwardIcon} label={t("toolbar.forward")} disabled={!canForward} onClick={onForward} />
      {!mobile && <ToolbarButton nav="refresh" icon="refresh" label={t("toolbar.refresh")} onClick={onRefresh} />}
      {!mobile && <ToolbarButton nav="home" icon={NavHomeIcon} label={t("toolbar.home")} onClick={onHome} />}
      {!mobile && actions.openReal && (
        <ToolbarButton nav="open-real" icon="external" label={t("toolbar.openReal")} onClick={actions.openReal} />
      )}
    </div>
  );

  const field = (
    <form role="search" onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-1.5">
      <label htmlFor="browser-address" className={cn("shrink-0 text-system text-text-muted", mobile && "sr-only")}>
        {t("address")}
      </label>
      <div className="flex h-push-button-h min-w-0 flex-1 items-center gap-1 border border-field-border bg-surface pl-1 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-focus-ring max-md:h-touch-target">
        <BrowserAppIcon size={16} />
        <input
          id="browser-address"
          ref={inputRef}
          data-browser-address
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          onKeyDown={keyDown}
          onFocus={(e) => e.currentTarget.select()}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="url"
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

export interface TabView {
  id: number;
  title: string;
}

/**
 * Tab strip: an ARIA tablist (arrow keys move between tabs, roving tabindex),
 * a close button per tab and a "+" for a new tab. Scrolls sideways on phones.
 */
export function BrowserTabStrip({
  tabs,
  activeId,
  panelId,
  onSelect,
  onClose,
  onNew,
}: {
  tabs: TabView[];
  activeId: number;
  panelId: string;
  onSelect: (id: number) => void;
  onClose: (id: number) => void;
  onNew: () => void;
}) {
  const t = useTranslations("apps.browser.tabs");

  function keyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === activeId);
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === -1) return;
    e.preventDefault();
    onSelect(tabs[next].id);
    const strip = e.currentTarget;
    requestAnimationFrame(() =>
      strip.querySelector<HTMLElement>(`[data-browser-tab="${tabs[next].id}"]`)?.focus(),
    );
  }

  return (
    <div className="flex shrink-0 items-end gap-0.5 overflow-x-auto border-b border-bevel-shadow px-1 pt-1">
      <div role="tablist" aria-label={t("label")} onKeyDown={keyDown} className="flex items-end gap-0.5">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <div
              key={tab.id}
              className={cn(
                "flex max-w-48 min-w-28 items-center gap-1 rounded-t-[3px] border border-b-0 border-bevel-shadow pl-1.5 text-system text-text",
                active ? "-mb-px bg-surface pb-px" : "bg-surface-muted hover:bg-surface",
              )}
            >
              <button
                type="button"
                role="tab"
                id={`browser-tab-${tab.id}`}
                data-browser-tab={tab.id}
                aria-selected={active}
                aria-controls={panelId}
                tabIndex={active ? 0 : -1}
                onClick={() => onSelect(tab.id)}
                className="flex h-6 min-w-0 flex-1 items-center gap-1 text-left outline-none focus-visible:underline max-md:h-9"
              >
                <BrowserAppIcon size={16} />
                <span className="truncate">{tab.title}</span>
              </button>
              <button
                type="button"
                data-browser-tab-close={tab.id}
                aria-label={t("close", { title: tab.title })}
                title={t("close", { title: tab.title })}
                onClick={() => onClose(tab.id)}
                className="flex size-5 shrink-0 items-center justify-center rounded-button hover:bg-highlight hover:text-highlight-text focus-light max-md:size-9"
              >
                <X className="size-3" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        data-browser-new-tab
        aria-label={t("newTab")}
        title={t("newTab")}
        onClick={onNew}
        className="mb-0.5 flex size-6 shrink-0 items-center justify-center rounded-button text-text hover:shadow-bevel-raised active:shadow-bevel-pressed focus-light max-md:size-9"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/** Status bar: the page state on the left, the browser's name on the right. */
export function BrowserStatusBar({ status, loading }: { status: string; loading: boolean }) {
  const t = useTranslations("apps.browser");
  return (
    <div className="flex h-statusbar shrink-0 items-stretch gap-0.5 p-0.5 text-system text-text">
      <span data-browser-status={loading ? "loading" : "done"} className="flex min-w-0 flex-1 items-center gap-1 px-1.5 shadow-bevel-sunken">
        <BrowserAppIcon size={16} />
        <span className="truncate">{status}</span>
      </span>
      <span className="flex items-center gap-1 px-1.5 shadow-bevel-sunken max-md:hidden">
        <DouglasOSLogo size={14} />
        {t("title")}
      </span>
    </div>
  );
}
