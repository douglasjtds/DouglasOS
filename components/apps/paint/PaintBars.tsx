"use client";

import type { ComponentType, MouseEvent, ReactNode } from "react";
import { flushSync } from "react-dom";
import { useTranslations } from "next-intl";
import { Menubar } from "radix-ui";
import { Brush, Eraser, PaintBucket, Pencil, Redo2, Slash, Square, Undo2 } from "lucide-react";
import { menuBarTriggerClass, menuItemClass, menuSurfaceClass } from "@/components/os/menuStyles";
import {
  PAINT_PALETTE,
  PAINT_SIZES,
  PAINT_TOOLS,
  usesSize,
  type PaintColor,
  type PaintSize,
  type PaintTool,
} from "@/lib/paint/tools";
import { cn } from "@/lib/utils";

/** What the menus can ask the app to do. */
export interface PaintActions {
  newCanvas: () => void;
  save: () => void;
  close: () => void;
  undo: () => void;
  redo: () => void;
}

const TOOL_ICONS: Record<PaintTool, ComponentType<{ className?: string }>> = {
  pencil: Pencil,
  brush: Brush,
  eraser: Eraser,
  fill: PaintBucket,
  line: Slash,
  rectangle: Square,
};

const shortcutClass = "ml-auto pl-6 text-text-muted group-data-[highlighted]:text-highlight-text max-md:hidden";

function MenuItem({
  onSelect,
  disabled,
  shortcut,
  action,
  children,
}: {
  onSelect: () => void;
  disabled?: boolean;
  shortcut?: string;
  action: string;
  children: ReactNode;
}) {
  return (
    <Menubar.Item
      data-paint-menu-item={action}
      disabled={disabled}
      onSelect={onSelect}
      className={cn(menuItemClass, "group max-md:min-h-touch-target")}
    >
      {children}
      {shortcut && <span className={shortcutClass}>{shortcut}</span>}
    </Menubar.Item>
  );
}

/** Menu bar: File (New, Save as PNG, Close) and Edit (Undo, Redo). Real items only. */
export function PaintMenuBar({
  actions,
  canUndo,
  canRedo,
}: {
  actions: PaintActions;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const t = useTranslations("apps.paint");
  const content = cn(menuSurfaceClass, "z-1200 min-w-44");
  return (
    <div className="flex h-menubar shrink-0 items-stretch border-b border-bevel-shadow max-md:h-touch-target">
      <Menubar.Root aria-label={t("menuBar")} className="flex items-stretch">
        <Menubar.Menu>
          <Menubar.Trigger data-paint-menu="file" className={menuBarTriggerClass}>
            {t("menu.file")}
          </Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content align="start" className={content}>
              <MenuItem action="new" onSelect={actions.newCanvas}>
                {t("menu.new")}
              </MenuItem>
              <MenuItem action="save" onSelect={actions.save} shortcut="Ctrl+S">
                {t("menu.save")}
              </MenuItem>
              <Menubar.Separator className="my-0.5 h-px bg-bevel-shadow" />
              <MenuItem action="close" onSelect={actions.close}>
                {t("menu.close")}
              </MenuItem>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
        <Menubar.Menu>
          <Menubar.Trigger data-paint-menu="edit" className={menuBarTriggerClass}>
            {t("menu.edit")}
          </Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content align="start" className={content}>
              <MenuItem action="undo" onSelect={actions.undo} disabled={!canUndo} shortcut="Ctrl+Z">
                {t("menu.undo")}
              </MenuItem>
              <MenuItem action="redo" onSelect={actions.redo} disabled={!canRedo} shortcut="Ctrl+Y">
                {t("menu.redo")}
              </MenuItem>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
      </Menubar.Root>
    </div>
  );
}

const toolButtonClass = cn(
  "flex size-7 shrink-0 items-center justify-center rounded-button text-text focus-light",
  "hover:shadow-bevel-raised aria-pressed:bg-surface aria-pressed:shadow-bevel-pressed",
  "disabled:pointer-events-none disabled:text-text-disabled",
  "max-md:size-touch-target",
);

/**
 * Tools, line widths and undo/redo. Desktop: the classic vertical tool column
 * on the left. Touch: two rows above the canvas (tools + undo/redo, then the
 * widths), every target 44px.
 */
export function PaintToolbox({
  mobile,
  tool,
  size,
  canUndo,
  canRedo,
  onTool,
  onSize,
  onUndo,
  onRedo,
}: {
  mobile: boolean;
  tool: PaintTool;
  size: PaintSize;
  canUndo: boolean;
  canRedo: boolean;
  onTool: (tool: PaintTool) => void;
  onSize: (size: PaintSize) => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const t = useTranslations("apps.paint");
  const sized = usesSize(tool);

  const tools = (
    <div
      role="toolbar"
      aria-label={t("tools.label")}
      aria-orientation={mobile ? "horizontal" : "vertical"}
      className={mobile ? "flex items-center gap-0.5" : "grid grid-cols-2 gap-0.5"}
    >
      {PAINT_TOOLS.map((id) => {
        const Icon = TOOL_ICONS[id];
        return (
          <button
            key={id}
            type="button"
            data-paint-tool={id}
            aria-pressed={tool === id}
            aria-label={t(`tools.${id}`)}
            title={t(`tools.${id}`)}
            onClick={() => onTool(id)}
            className={toolButtonClass}
          >
            <Icon className="size-4 max-md:size-5" aria-hidden />
          </button>
        );
      })}
    </div>
  );

  /**
   * Undo/Redo by button: when the last step disables the button that has
   * focus, hand focus to its partner so keyboard users (and Ctrl+Z / Ctrl+Y)
   * stay inside Paint instead of falling back to the page.
   */
  const step = (action: () => void, partner: () => HTMLButtonElement | null) =>
    (e: MouseEvent<HTMLButtonElement>) => {
      const self = e.currentTarget;
      // Commit synchronously so the hand-off happens before the next key press
      // (a rAF here lost the race against a fast Ctrl+Y on WebKit).
      flushSync(action);
      if (self.disabled && document.activeElement !== partner()) partner()?.focus();
    };
  const partnerOf = (action: "undo" | "redo") => () =>
    document.querySelector<HTMLButtonElement>(`[data-paint-action="${action}"]`);

  const history = (
    <div className={mobile ? "flex items-center gap-0.5" : "grid grid-cols-2 gap-0.5"}>
      <button
        type="button"
        data-paint-action="undo"
        aria-label={t("menu.undo")}
        title={t("menu.undo")}
        disabled={!canUndo}
        onClick={step(onUndo, partnerOf("redo"))}
        className={toolButtonClass}
      >
        <Undo2 className="size-4 max-md:size-5" aria-hidden />
      </button>
      <button
        type="button"
        data-paint-action="redo"
        aria-label={t("menu.redo")}
        title={t("menu.redo")}
        disabled={!canRedo}
        onClick={step(onRedo, partnerOf("undo"))}
        className={toolButtonClass}
      >
        <Redo2 className="size-4 max-md:size-5" aria-hidden />
      </button>
    </div>
  );

  const sizes = (
    <div
      role="group"
      aria-label={t("size.label")}
      className={cn(
        "flex gap-0.5 bg-surface p-0.5 shadow-bevel-sunken",
        // Desktop: stretch to the tool column, or the width bars collapse to 0.
        mobile ? "flex-row" : "flex-col self-stretch",
      )}
    >
      {PAINT_SIZES.map((px) => (
        <button
          key={px}
          type="button"
          data-paint-size={px}
          aria-pressed={sized && size === px}
          aria-label={t("size.value", { px })}
          title={t("size.value", { px })}
          disabled={!sized}
          onClick={() => onSize(px)}
          className={cn(
            "group/size flex h-4 items-center justify-center px-1 outline-none focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-text",
            "aria-pressed:bg-highlight disabled:opacity-40",
            "max-md:h-touch-target max-md:w-touch-target",
          )}
        >
          <span
            aria-hidden
            className="block w-full max-w-8 rounded-full bg-text group-aria-pressed/size:bg-highlight-text"
            style={{ height: Math.min(px, 8) }}
          />
        </button>
      ))}
    </div>
  );

  if (mobile) {
    return (
      <div data-paint-toolbox className="flex shrink-0 flex-col gap-0.5 border-b border-bevel-shadow p-0.5">
        <div className="flex items-center justify-between gap-1 overflow-x-auto">
          {tools}
          {history}
        </div>
        {sizes}
      </div>
    );
  }
  return (
    <div data-paint-toolbox className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-bevel-shadow p-1">
      {tools}
      {sizes}
      {history}
    </div>
  );
}

/**
 * The 28-color palette (two rows of 14) with the current color on the left.
 * Touch: 44px swatches that scroll sideways.
 */
export function PaintPalette({
  color,
  onColor,
}: {
  color: PaintColor;
  onColor: (color: PaintColor) => void;
}) {
  const t = useTranslations("apps.paint.palette");
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-t border-bevel-shadow p-1">
      <span
        data-paint-current-color={color}
        role="img"
        aria-label={t("current", { hex: color })}
        title={t("current", { hex: color })}
        className="size-8 shrink-0 border border-bevel-dark shadow-bevel-sunken max-md:size-touch-target"
        style={{ backgroundColor: color }}
      />
      <div
        role="group"
        aria-label={t("label")}
        className="grid grid-flow-col grid-rows-2 gap-px overflow-x-auto max-md:pb-0.5"
      >
        {PAINT_PALETTE.map((hex, i) => (
          <button
            key={hex}
            type="button"
            data-paint-color={hex}
            aria-pressed={color === hex}
            aria-label={t("swatch", { n: i + 1, hex })}
            title={hex}
            onClick={() => onColor(hex)}
            className={cn(
              "size-4 shrink-0 border border-bevel-dark outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring",
              "aria-pressed:outline-2 aria-pressed:outline-offset-1 aria-pressed:outline-highlight",
              "max-md:size-touch-target",
            )}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    </div>
  );
}
