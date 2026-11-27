"use client";

import { memo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { CardSlot, PlayingCard, useCardLabel } from "@/components/apps/games/shared/PlayingCard";
import { canRecycle, type SolitaireState, type Source } from "@/lib/games/solitaire/engine";
import {
  TABLEAU_PILE,
  columnX,
  fanOffsets,
  pileAtPoint,
  type FocusPos,
  type TableMetrics,
} from "@/lib/games/solitaire/layout";
import { cn } from "@/lib/utils";

/** `data-focus-key` of the element that holds the roving focus. */
export function focusKey(game: SolitaireState, focus: FocusPos): string {
  if (focus.pile < TABLEAU_PILE) return `p${focus.pile}`;
  const column = game.tableau[focus.pile - TABLEAU_PILE];
  return column.faceUp.length > 0 ? `p${focus.pile}-c${focus.card}` : `p${focus.pile}`;
}

function sameSource(a: Source | null, b: Source): boolean {
  if (!a || a.kind !== b.kind) return false;
  if (a.kind === "waste") return true;
  if (a.kind === "foundation" && b.kind === "foundation") return a.index === b.index;
  return a.kind === "tableau" && b.kind === "tableau" && a.index === b.index && a.start === b.start;
}

/** Is the face-up card `j` of column `col` part of the selected run? */
function inSelectedRun(sel: Source | null, col: number, j: number): boolean {
  return sel?.kind === "tableau" && sel.index === col && j >= sel.start;
}

interface DragState {
  source: Source;
  pointerId: number;
  x0: number;
  y0: number;
  active: boolean;
}

const DRAG_THRESHOLD = 5;

const buttonClass =
  "absolute rounded-card p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring-inverse touch-manipulation";

export interface SolitaireBoardProps {
  game: SolitaireState;
  metrics: TableMetrics;
  /** Play-area height, used to tighten tall columns. */
  height: number;
  selection: Source | null;
  focus: FocusPos;
  /** Win celebration in progress: foundations look emptied. */
  celebrating: boolean;
  onActivate: (pile: number, card?: number) => void;
  onToFoundation: (source: Source) => void;
  onDrop: (source: Source, pile: number) => void;
  onFocus: (pos: FocusPos) => void;
  children?: ReactNode;
}

/**
 * The Klondike table: top row (stock, waste, four foundations) over seven
 * fanned columns, all absolutely positioned from `metrics`. Every pile is a
 * real button with an accessible name and a roving tab stop; mouse users can
 * also drag face-up cards (Pointer Events).
 */
export const SolitaireBoard = memo(function SolitaireBoard({
  game,
  metrics: m,
  height,
  selection,
  focus,
  celebrating,
  onActivate,
  onToFoundation,
  onDrop,
  onFocus,
  children,
}: SolitaireBoardProps) {
  const t = useTranslations("games.solitaire");
  const cardLabel = useCardLabel();
  const tableRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const [dragOffset, setDragOffset] = useState<{ source: Source; dx: number; dy: number } | null>(null);

  const activeKey = focusKey(game, focus);
  const available = Math.max(m.cardH, height - m.tableauTop - m.pad);

  const dragStyle = (source: Source): CSSProperties | undefined =>
    dragOffset && sameDragged(dragOffset.source, source)
      ? { transform: `translate(${dragOffset.dx}px, ${dragOffset.dy}px)`, zIndex: 200, pointerEvents: "none" }
      : undefined;

  const pointerHandlers = (source: Source) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag.current = { source, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, active: false };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.x0;
      const dy = e.clientY - d.y0;
      if (!d.active && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.active = true;
      setDragOffset({ source: d.source, dx, dy });
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      drag.current = null;
      if (!d || !d.active) return;
      // Swallow the click that ends this drag (if the browser sends one).
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      setDragOffset(null);
      const rect = tableRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pile = pileAtPoint(m, e.clientX - rect.left, e.clientY - rect.top);
      if (pile !== null) onDrop(d.source, pile);
    },
    onPointerCancel: () => {
      drag.current = null;
      setDragOffset(null);
    },
  });

  /** Click wrapper that swallows the click ending a drag. */
  const click = (fn: () => void) => () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    fn();
  };

  const at = (x: number, y: number, z = 1): CSSProperties => ({ left: x, top: y, zIndex: z });
  const tabIndex = (key: string) => (key === activeKey ? 0 : -1);

  // ---- Top row -----------------------------------------------------------
  const stockKey = "p0";
  const stockLabel =
    game.stock.length > 0
      ? t("stock", { count: game.stock.length })
      : canRecycle(game)
        ? t("stockRecycle")
        : t("stockEmpty");
  const stock = (
    <button
      key="stock"
      type="button"
      data-solitaire-pile="stock"
      data-focus-key={stockKey}
      tabIndex={tabIndex(stockKey)}
      aria-label={stockLabel}
      className={buttonClass}
      style={at(columnX(m, 0), m.pad)}
      onClick={click(() => onActivate(0))}
      onFocus={() => onFocus({ pile: 0, card: 0 })}
    >
      {game.stock.length > 0 ? (
        <PlayingCard card={game.stock[game.stock.length - 1]} faceDown />
      ) : (
        <CardSlot>{canRecycle(game) && <RotateCcw className="size-1/2" aria-hidden />}</CardSlot>
      )}
    </button>
  );

  const wasteVisible = game.waste.slice(game.drawCount === 3 ? -3 : -2);
  const wasteTop = game.waste[game.waste.length - 1];
  const wasteSource: Source = { kind: "waste" };
  const fanned = game.drawCount === 3;
  const waste = (
    <div key="waste" data-solitaire-pile="waste">
      {wasteVisible.slice(0, -1).map((card, i) => (
        <PlayingCard
          key={card.id}
          card={card}
          aria-hidden
          className="absolute"
          style={at(columnX(m, 1) + (fanned ? i * m.wasteFan : 0), m.pad, 1 + i)}
        />
      ))}
      <button
        type="button"
        data-focus-key="p1"
        data-solitaire-card={wasteTop?.id}
        tabIndex={tabIndex("p1")}
        aria-label={wasteTop ? t("waste", { card: cardLabel(wasteTop) }) : t("wasteEmpty")}
        aria-pressed={wasteTop ? selection?.kind === "waste" : undefined}
        className={buttonClass}
        style={{
          ...at(columnX(m, 1) + (fanned ? (wasteVisible.length - 1) * m.wasteFan : 0), m.pad, 5),
          ...dragStyle(wasteSource),
        }}
        onClick={click(() => onActivate(1))}
        onDoubleClick={() => wasteTop && onToFoundation(wasteSource)}
        onFocus={() => onFocus({ pile: 1, card: 0 })}
        {...(wasteTop ? pointerHandlers(wasteSource) : {})}
      >
        {wasteTop ? <PlayingCard card={wasteTop} selected={selection?.kind === "waste"} /> : <CardSlot />}
      </button>
    </div>
  );

  const foundations = game.foundations.map((pile, index) => {
    const pileIndex = 2 + index;
    const key = `p${pileIndex}`;
    const shown = celebrating ? [] : pile;
    const top = shown[shown.length - 1];
    const under = shown[shown.length - 2];
    const source: Source = { kind: "foundation", index };
    const selected = sameSource(selection, source);
    const x = columnX(m, 3 + index);
    return (
      <div key={key} data-solitaire-pile={`foundation-${index}`}>
        {under && <PlayingCard card={under} aria-hidden className="absolute" style={at(x, m.pad)} />}
        <button
          type="button"
          data-focus-key={key}
          data-solitaire-card={top?.id}
          tabIndex={tabIndex(key)}
          aria-label={
            top ? t("foundation", { n: index + 1, card: cardLabel(top) }) : t("foundationEmpty", { n: index + 1 })
          }
          aria-pressed={top ? selected : undefined}
          className={buttonClass}
          style={{ ...at(x, m.pad, 2), ...dragStyle(source) }}
          onClick={click(() => onActivate(pileIndex))}
          onFocus={() => onFocus({ pile: pileIndex, card: 0 })}
          {...(top ? pointerHandlers(source) : {})}
        >
          {top ? <PlayingCard card={top} selected={selected} /> : <CardSlot />}
        </button>
      </div>
    );
  });

  // ---- Tableau -----------------------------------------------------------
  let tallest = 0;
  const columns = game.tableau.map((column, col) => {
    const pileIndex = TABLEAU_PILE + col;
    const n = col + 1;
    const x = columnX(m, col);
    const { down, up } = fanOffsets(m.cardH, column.faceDown.length, column.faceUp.length, available);
    const upTop = column.faceDown.length * down;
    tallest = Math.max(tallest, upTop + Math.max(0, column.faceUp.length - 1) * up + m.cardH);
    const flippable = column.faceUp.length === 0 && column.faceDown.length > 0;
    const columnKey = `p${pileIndex}`;
    return (
      <div
        key={col}
        data-solitaire-pile={`tableau-${col}`}
        className="absolute"
        style={{ left: x, top: m.tableauTop, width: m.cardW, bottom: 0 }}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("button")) click(() => onActivate(pileIndex))();
        }}
      >
        {column.faceDown.map((card, i) => {
          const isTop = flippable && i === column.faceDown.length - 1;
          if (!isTop) {
            return (
              <PlayingCard key={card.id} card={card} faceDown aria-hidden className="absolute" style={at(0, i * down, i)} />
            );
          }
          return (
            <button
              key={card.id}
              type="button"
              data-focus-key={columnKey}
              data-solitaire-flip={col}
              tabIndex={tabIndex(columnKey)}
              aria-label={t("faceDown", { n })}
              className={buttonClass}
              style={at(0, i * down, i)}
              onClick={click(() => onActivate(pileIndex))}
              onFocus={() => onFocus({ pile: pileIndex, card: 0 })}
            >
              <PlayingCard card={card} faceDown />
            </button>
          );
        })}
        {column.faceDown.length === 0 && column.faceUp.length === 0 && (
          <button
            type="button"
            data-focus-key={columnKey}
            tabIndex={tabIndex(columnKey)}
            aria-label={t("columnEmpty", { n })}
            className={buttonClass}
            style={at(0, 0)}
            onClick={click(() => onActivate(pileIndex))}
            onFocus={() => onFocus({ pile: pileIndex, card: 0 })}
          >
            <CardSlot />
          </button>
        )}
        {column.faceUp.map((card, j) => {
          const key = `p${pileIndex}-c${j}`;
          const source: Source = { kind: "tableau", index: col, start: j };
          const isTop = j === column.faceUp.length - 1;
          const selected = inSelectedRun(selection, col, j);
          const dragged =
            dragOffset?.source.kind === "tableau" &&
            dragOffset.source.index === col &&
            j >= dragOffset.source.start;
          return (
            <button
              key={card.id}
              type="button"
              data-focus-key={key}
              data-solitaire-card={card.id}
              tabIndex={tabIndex(key)}
              aria-label={t("card", { card: cardLabel(card), n })}
              aria-pressed={selected}
              className={buttonClass}
              style={{
                ...at(0, upTop + j * up, 20 + j),
                ...(dragged
                  ? { transform: `translate(${dragOffset.dx}px, ${dragOffset.dy}px)`, zIndex: 200 + j, pointerEvents: "none" }
                  : undefined),
              }}
              onClick={click(() => onActivate(pileIndex, j))}
              onDoubleClick={() => isTop && onToFoundation(source)}
              onFocus={() => onFocus({ pile: pileIndex, card: j })}
              {...pointerHandlers(source)}
            >
              <PlayingCard card={card} selected={selected} />
            </button>
          );
        })}
      </div>
    );
  });

  const minHeight = m.tableauTop + tallest + m.pad;
  return (
    <div
      ref={tableRef}
      data-solitaire-table
      className={cn("relative w-full", dragOffset && "cursor-grabbing")}
      style={{ height: Math.max(height, minHeight) }}
    >
      {stock}
      {waste}
      {foundations}
      {columns}
      {children}
    </div>
  );
});

function sameDragged(a: Source, b: Source): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "foundation" && b.kind === "foundation") return a.index === b.index;
  return a.kind === "waste";
}
