"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Menubar } from "radix-ui";
import { GamesFolderIcon } from "@/components/icons/GameIcons";
import { menuBarTriggerClass, menuItemClass, menuSurfaceClass } from "@/components/os/menuStyles";
import { useIsMobile } from "@/hooks/useIsMobile";
import { launch } from "@/lib/apps/launch";
import { GAME_IDS, getApp, type GameId } from "@/lib/apps/registry";
import { useWindowStore } from "@/lib/store/windowStore";
import { cn } from "@/lib/utils";

/**
 * The desktop "Games" folder (stage 12): a folder window with a large-icon
 * view of the games. Desktop: click selects, double-click / Enter opens.
 * Touch: one tap opens (like the touch desktop). Arrow keys move the
 * selection. The same games are in Start → All Programs ▸ Games and Run.
 */
export default function GamesFolderApp() {
  const t = useTranslations("apps.games");
  const tApps = useTranslations("apps");
  const mobile = useIsMobile();
  const [selected, setSelected] = useState<GameId | null>(null);
  const focusItem = (id: GameId) =>
    document.querySelector<HTMLButtonElement>(`[data-game-launcher="${id}"]`)?.focus();

  function onItemKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = GAME_IDS[(index + step + GAME_IDS.length) % GAME_IDS.length];
    setSelected(next);
    focusItem(next);
  }

  const content = cn(menuSurfaceClass, "z-1200 min-w-40");
  return (
    <div data-games-folder className="flex h-full min-h-0 flex-col bg-button-face text-text">
      <div className="flex h-menubar shrink-0 items-stretch border-b border-bevel-shadow max-md:h-touch-target">
        <Menubar.Root aria-label={t("menuBar")} className="flex items-stretch">
          <Menubar.Menu>
            <Menubar.Trigger data-games-menu="file" className={menuBarTriggerClass}>
              {t("menu.file")}
            </Menubar.Trigger>
            <Menubar.Portal>
              <Menubar.Content align="start" className={content}>
                <Menubar.Item
                  disabled={!selected}
                  onSelect={() => selected && launch(selected)}
                  className={cn(menuItemClass, "max-md:min-h-touch-target")}
                >
                  {t("menu.open")}
                </Menubar.Item>
                <Menubar.Separator className="my-0.5 h-px bg-bevel-shadow" />
                <Menubar.Item
                  onSelect={() => useWindowStore.getState().closeWindow("games")}
                  className={cn(menuItemClass, "max-md:min-h-touch-target")}
                >
                  {t("menu.close")}
                </Menubar.Item>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>
        </Menubar.Root>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-surface p-3 shadow-bevel-sunken">
        <div className="mb-3 flex items-center gap-2">
          <GamesFolderIcon size={32} />
          <div>
            <h3 className="text-heading text-text">{t("heading")}</h3>
            <p className="text-system text-text-muted">{t("intro")}</p>
          </div>
        </div>
        <ul
          aria-label={t("heading")}
          className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2"
        >
          {GAME_IDS.map((id, index) => {
            const { icon: Icon } = getApp(id);
            const isSelected = selected === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  data-game-launcher={id}
                  aria-describedby={`game-description-${id}`}
                  aria-pressed={isSelected}
                  tabIndex={selected ? (isSelected ? 0 : -1) : index === 0 ? 0 : -1}
                  onClick={() => (mobile ? launch(id) : setSelected(id))}
                  onDoubleClick={() => !mobile && launch(id)}
                  onFocus={() => setSelected(id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") launch(id);
                    else onItemKeyDown(e, index);
                  }}
                  className="flex w-full flex-col items-center gap-1 rounded-control p-2 text-center outline-none focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-text max-md:min-h-touch-target"
                >
                  <span className={cn(isSelected && "icon-selected-tint")}>
                    <Icon size={48} />
                  </span>
                  <span
                    className={cn(
                      "px-0.5 text-system",
                      isSelected ? "bg-highlight text-highlight-text" : "text-text",
                    )}
                  >
                    {tApps(`${id}.title`)}
                  </span>
                  <span id={`game-description-${id}`} className="sr-only">
                    {tApps(`${id}.description`)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex h-statusbar shrink-0 items-stretch gap-0.5 p-0.5 text-system text-text">
        <span data-games-status className="flex flex-1 items-center px-1.5 shadow-bevel-sunken">
          {selected ? tApps(`${selected}.description`) : t("objects", { count: GAME_IDS.length })}
        </span>
      </div>
    </div>
  );
}
