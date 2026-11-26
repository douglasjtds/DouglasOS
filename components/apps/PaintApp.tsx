"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { PaintMenuBar, PaintPalette, PaintToolbox, type PaintActions } from "@/components/apps/paint/PaintBars";
import { usePaintCanvas } from "@/components/apps/paint/usePaintCanvas";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWindowStore } from "@/lib/store/windowStore";
import {
  DEFAULT_COLOR,
  DEFAULT_SIZE,
  DEFAULT_TOOL,
  type PaintColor,
  type PaintSize,
  type PaintTool,
} from "@/lib/paint/tools";

/**
 * DouglasOS Paint (stage 10, DESKTOP-INTERFACE-SPEC §10): a small paint
 * program in the classic layout — menu bar, tool column, canvas workspace,
 * 28-color palette, status bar — with original name and icons. A fun app:
 * it lives in All Programs ▸ Accessories only and stores nothing (closing it
 * discards the drawing; Save as PNG downloads it locally, nothing uploads).
 */
export default function PaintApp() {
  const t = useTranslations("apps.paint");
  const mobile = useIsMobile();
  const [tool, setTool] = useState<PaintTool>(DEFAULT_TOOL);
  const [color, setColor] = useState<PaintColor>(DEFAULT_COLOR);
  const [size, setSize] = useState<PaintSize>(DEFAULT_SIZE);
  const {
    workspaceRef,
    canvasRef,
    overlayRef,
    dimensions: dims,
    canUndo,
    canRedo,
    undo,
    redo,
    newCanvas,
    save,
    onKeyDown: cancelOnEscape,
    surfaceHandlers,
  } = usePaintCanvas({ tool, color, size });

  const actions: PaintActions = {
    newCanvas,
    save,
    close: () => useWindowStore.getState().closeWindow("paint"),
    undo,
    redo,
  };

  /** Ctrl/Cmd+Z undo, Ctrl+Y or Ctrl+Shift+Z redo, Ctrl+S save; Esc cancels a stroke. */
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    cancelOnEscape(e);
    if (e.defaultPrevented) return;
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === "z" && !e.shiftKey) actions.undo();
    else if (key === "y" || (key === "z" && e.shiftKey)) actions.redo();
    else if (key === "s") actions.save();
    else return;
    e.preventDefault();
  }

  return (
    <div data-paint-app className="flex h-full min-h-0 flex-col" onKeyDown={onKeyDown}>
      <PaintMenuBar actions={actions} canUndo={canUndo} canRedo={canRedo} />
      <div className="flex min-h-0 flex-1 max-md:flex-col">
        <PaintToolbox
          mobile={mobile}
          tool={tool}
          size={size}
          canUndo={canUndo}
          canRedo={canRedo}
          onTool={setTool}
          onSize={setSize}
          onUndo={undo}
          onRedo={redo}
        />
        {/* Workspace: the gray area the canvas sits on; scrolls if the window shrinks. */}
        <div ref={workspaceRef} className="min-h-0 min-w-0 flex-1 overflow-auto bg-bevel-shadow p-2">
          <div
            className="relative shadow-window-inactive"
            style={dims ? { width: dims.width, height: dims.height } : undefined}
          >
            <canvas
              ref={canvasRef}
              data-paint-canvas
              role="img"
              aria-label={dims ? t("canvas", { width: dims.width, height: dims.height }) : undefined}
              className="absolute inset-0 block bg-surface"
            />
            <canvas
              ref={overlayRef}
              data-paint-surface
              aria-hidden
              tabIndex={-1}
              className="absolute inset-0 block cursor-crosshair touch-none outline-none"
              {...surfaceHandlers}
            />
          </div>
        </div>
      </div>
      <PaintPalette color={color} onColor={setColor} />
      <div className="flex h-statusbar shrink-0 items-stretch gap-0.5 p-0.5 text-system text-text">
        <span data-paint-status className="flex min-w-0 flex-1 items-center truncate px-1.5 shadow-bevel-sunken">
          {t(`hints.${tool}`)}
        </span>
        {dims && (
          <span className="flex items-center px-1.5 shadow-bevel-sunken">
            {t("dimensions", { width: dims.width, height: dims.height })}
          </span>
        )}
      </div>
    </div>
  );
}
