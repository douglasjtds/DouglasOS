"use client";

import type { KeyboardEventHandler, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AlertDialog, Menubar } from "radix-ui";
import { Check } from "lucide-react";
import { menuBarTriggerClass, menuItemClass, menuSurfaceClass } from "@/components/os/menuStyles";
import { MessageBox } from "@/components/os/MessageBox";
import { Button } from "@/components/ui/button";
import type { GameId } from "@/lib/apps/registry";
import { useWindowStore } from "@/lib/store/windowStore";
import { cn } from "@/lib/utils";

export interface GameMenuItem {
  /** Stable id, exposed as `data-game-menu-item` for tests. */
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** Shown on desktop only ("F2", "Ctrl+Z"). */
  shortcut?: string;
  /** Radio/check state for option items (difficulty, draw 1/3…). */
  checked?: boolean;
}

export interface GameMenu {
  /** Stable id, exposed as `data-game-menu`. */
  id: string;
  label: string;
  items: (GameMenuItem | "separator")[];
}

const shortcutClass =
  "ml-auto pl-6 text-text-muted group-data-[highlighted]:text-highlight-text max-md:hidden";

/**
 * Frame shared by every game window (stage 12, `surface: "bare"`): a menu bar
 * (the game passes its menus; `useStandardGameMenu` builds the usual Game
 * menu), the play area, and a sunken status bar. The play area scrolls if
 * the window is smaller than the board, and never steals the window's chrome.
 */
export function GameShell({
  game,
  menus,
  status,
  children,
  className,
  bodyClassName,
  onKeyDown,
}: {
  game: GameId;
  menus: GameMenu[];
  /** Status bar cells, left to right (score, time, moves…). */
  status?: ReactNode[];
  children: ReactNode;
  className?: string;
  /** Extra classes for the play area (e.g. `bg-felt-gradient`). */
  bodyClassName?: string;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}) {
  const t = useTranslations("apps.games.common");
  const content = cn(menuSurfaceClass, "z-1200 min-w-44");
  return (
    <div
      data-game={game}
      onKeyDown={onKeyDown}
      className={cn("flex h-full min-h-0 flex-col bg-button-face text-text", className)}
    >
      <div className="flex h-menubar shrink-0 items-stretch border-b border-bevel-shadow max-md:h-touch-target">
        <Menubar.Root aria-label={t("menuBar")} className="flex items-stretch">
          {menus.map((menu) => (
            <Menubar.Menu key={menu.id}>
              <Menubar.Trigger data-game-menu={menu.id} className={menuBarTriggerClass}>
                {menu.label}
              </Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Content align="start" className={content}>
                  {menu.items.map((item, i) =>
                    item === "separator" ? (
                      <Menubar.Separator key={`sep-${i}`} className="my-0.5 h-px bg-bevel-shadow" />
                    ) : item.checked === undefined ? (
                      <Menubar.Item
                        key={item.id}
                        data-game-menu-item={item.id}
                        disabled={item.disabled}
                        onSelect={item.onSelect}
                        className={cn(menuItemClass, "group max-md:min-h-touch-target")}
                      >
                        <span className="w-3" />
                        {item.label}
                        {item.shortcut && <span className={shortcutClass}>{item.shortcut}</span>}
                      </Menubar.Item>
                    ) : (
                      <Menubar.CheckboxItem
                        key={item.id}
                        data-game-menu-item={item.id}
                        disabled={item.disabled}
                        checked={item.checked}
                        onSelect={item.onSelect}
                        className={cn(menuItemClass, "group max-md:min-h-touch-target")}
                      >
                        <span className="flex w-3 justify-center">
                          <Menubar.ItemIndicator>
                            <Check className="size-3" aria-hidden />
                          </Menubar.ItemIndicator>
                        </span>
                        {item.label}
                        {item.shortcut && <span className={shortcutClass}>{item.shortcut}</span>}
                      </Menubar.CheckboxItem>
                    ),
                  )}
                </Menubar.Content>
              </Menubar.Portal>
            </Menubar.Menu>
          ))}
        </Menubar.Root>
      </div>
      <div
        data-game-board
        className={cn("relative min-h-0 flex-1 overflow-auto", bodyClassName)}
      >
        {children}
      </div>
      {status && status.length > 0 && (
        <div
          data-game-status
          role="status"
          className="flex h-statusbar shrink-0 items-stretch gap-0.5 p-0.5 text-system text-text"
        >
          {status.map((cell, i) => (
            <span key={i} className="flex flex-1 items-center px-1.5 shadow-bevel-sunken">
              {cell}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The usual "Game" menu: New game (F2), optional Undo (Ctrl+Z), the game's
 * own option items, then Exit (closes the window). Games add more menus
 * (Help, Options) next to it as they need.
 */
export function useStandardGameMenu({
  game,
  onNewGame,
  onUndo,
  canUndo = false,
  options = [],
}: {
  game: GameId;
  onNewGame: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  options?: (GameMenuItem | "separator")[];
}): GameMenu {
  const t = useTranslations("apps.games.common");
  const items: (GameMenuItem | "separator")[] = [
    { id: "new", label: t("newGame"), onSelect: onNewGame, shortcut: "F2" },
  ];
  if (onUndo) {
    items.push({ id: "undo", label: t("undo"), onSelect: onUndo, disabled: !canUndo, shortcut: "Ctrl+Z" });
  }
  if (options.length > 0) items.push("separator", ...options);
  items.push("separator", {
    id: "exit",
    label: t("exit"),
    onSelect: () => useWindowStore.getState().closeWindow(game),
  });
  return { id: "game", label: t("game"), items };
}

/**
 * Win / game-over message box: the message, then "Play again" (default,
 * focused) and "Close". Uses the shell's `MessageBox` (focus trap; Esc just
 * closes it, leaving the finished board on screen).
 */
export function GameOverDialog({
  open,
  onOpenChange,
  title,
  message,
  icon,
  onPlayAgain,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: ReactNode;
  icon: ReactNode;
  onPlayAgain: () => void;
}) {
  const t = useTranslations("apps.games.common");
  return (
    <MessageBox
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      icon={icon}
      testId="game-over"
      actions={
        <>
          {/* Radix focuses the Cancel part: here that's the default action. */}
          <AlertDialog.Cancel asChild>
            <Button variant="primary" data-game-action="play-again" onClick={onPlayAgain}>
              {t("playAgain")}
            </Button>
          </AlertDialog.Cancel>
          <Button data-game-action="close" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </>
      }
    >
      {message}
    </MessageBox>
  );
}
