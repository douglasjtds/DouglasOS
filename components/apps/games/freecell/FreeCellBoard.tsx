"use client";

import { memo, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { SUITS, SUIT_SYMBOLS, type Card } from "@/lib/games/cards";
import { runLength, type FreeCellState, type Location } from "@/lib/games/freecell/engine";
import { CardSlot, PlayingCard, useCardLabel } from "@/components/apps/games/shared/PlayingCard";
import { cn } from "@/lib/utils";

export interface Selection {
  from: Location;
  count: number;
}

/** Roving-focus order: 0–3 free cells, 4–7 foundations, 8–15 columns. */
export function pileAt(index: number): Location {
  if (index < 4) return { kind: "free", index };
  if (index < 8) return { kind: "foundation", index: index - 4 };
  return { kind: "column", index: index - 8 };
}

export function pileIndex(loc: Location): number {
  return loc.kind === "free" ? loc.index : loc.kind === "foundation" ? 4 + loc.index : 8 + loc.index;
}

/** Next focus index for an arrow key (top row 0–7 sits above columns 8–15). */
export function moveFocus(index: number, key: string): number {
  const top = index < 8;
  const col = top ? index : index - 8;
  switch (key) {
    case "ArrowLeft":
      return (top ? 0 : 8) + Math.max(0, col - 1);
    case "ArrowRight":
      return (top ? 0 : 8) + Math.min(7, col + 1);
    case "ArrowUp":
      return col;
    case "ArrowDown":
      return 8 + col;
    case "Home":
      return top ? 0 : 8;
    case "End":
      return top ? 7 : 15;
    default:
      return index;
  }
}

const sameLoc = (a: Location | undefined, b: Location) => !!a && a.kind === b.kind && a.index === b.index;

const pileClass =
  "relative shrink-0 rounded-card outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring-inverse";

/**
 * The FreeCell table: free cells | foundations on top, eight fanned columns
 * below. Each pile is one focusable "button" (roving tabindex); clicking a
 * card inside a column picks the run from that card. Fans compress so long
 * columns fit the measured height of the play area.
 */
export const FreeCellBoard = memo(function FreeCellBoard({
  state,
  selection,
  focusIndex,
  isMobile,
  onActivate,
  onQuickMove,
  onFocusChange,
  onKeyDown,
}: {
  state: FreeCellState;
  selection: Selection | null;
  focusIndex: number;
  isMobile: boolean;
  onActivate: (loc: Location, cardIndex?: number) => void;
  onQuickMove: (loc: Location) => void;
  onFocusChange: (index: number) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const t = useTranslations("games.freecell");
  const cardLabel = useCardLabel();
  const columnsRef = useRef<HTMLDivElement>(null);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);

  // Measure the free height below the top row so fans can compress.
  useEffect(() => {
    const el = columnsRef.current?.closest<HTMLElement>("[data-game-board]");
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const columns = columnsRef.current;
      if (!columns) return;
      const offset = columns.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
      setAvailableHeight(Math.max(0, el.clientHeight - offset - 8));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const tableStyle = {
    ...(isMobile
      ? { "--card-w": "min(44px, calc((100vw - 56px) / 8))", "--card-h": "calc(var(--card-w) * 1.36)" }
      : { "--card-w": "var(--spacing-card-w)", "--card-h": "var(--spacing-card-h)" }),
    "--avail-h": availableHeight === null ? "100000px" : `${availableHeight}px`,
    "--fan-max": "calc(var(--card-h) * 0.27)",
    "--fan-min": isMobile ? "9px" : "13px",
  } as CSSProperties;

  const pileName = (loc: Location) =>
    loc.kind === "free"
      ? t("freeCell", { index: loc.index + 1 })
      : loc.kind === "foundation"
        ? t("foundation", { index: loc.index + 1 })
        : t("column", { index: loc.index + 1 });

  const pileLabel = (loc: Location, cards: Card[]) => {
    const pile = pileName(loc);
    const label = cards.length
      ? t("pileTop", { pile, count: cards.length, card: cardLabel(cards[cards.length - 1]) })
      : t("pileEmpty", { pile });
    return sameLoc(selection?.from, loc) ? t("pileSelected", { label }) : label;
  };

  const pileProps = (loc: Location, cards: Card[]) => {
    const index = pileIndex(loc);
    return {
      role: "button",
      tabIndex: index === focusIndex ? 0 : -1,
      "aria-label": pileLabel(loc, cards),
      "aria-pressed": sameLoc(selection?.from, loc),
      "data-pile": `${loc.kind}-${loc.index}`,
      "data-pile-index": index,
      "data-selected": sameLoc(selection?.from, loc) || undefined,
      onFocus: () => onFocusChange(index),
      onClick: () => onActivate(loc),
    } as const;
  };

  const renderSingle = (loc: Location, card: Card | null, placeholder?: string) => (
    <div
      key={`${loc.kind}-${loc.index}`}
      {...pileProps(loc, card ? [card] : [])}
      onDoubleClick={() => card && onQuickMove(loc)}
      className={cn(pileClass, "cursor-pointer")}
    >
      <CardSlot aria-hidden className="text-[calc(var(--card-w)*0.45)]">
        {placeholder}
      </CardSlot>
      {card && (
        <PlayingCard
          card={card}
          aria-hidden
          selected={sameLoc(selection?.from, loc)}
          className="absolute inset-0"
        />
      )}
    </div>
  );

  return (
    <div
      data-freecell-table
      data-game-number={state.gameNumber}
      data-moves={state.moves}
      aria-label={t("board")}
      role="group"
      onKeyDown={onKeyDown}
      style={tableStyle}
      className="mx-auto flex w-fit flex-col gap-3 p-2 max-md:gap-2"
    >
      <div className="flex gap-2 max-md:gap-1">
        {state.freeCells.map((card, index) => renderSingle({ kind: "free", index }, card))}
        {state.foundations.map((pile, index) =>
          renderSingle({ kind: "foundation", index }, pile.at(-1) ?? null, SUIT_SYMBOLS[SUITS[index]]),
        )}
      </div>
      <div ref={columnsRef} className="flex items-start gap-2 max-md:gap-1">
        {state.columns.map((cards, index) => {
          const loc: Location = { kind: "column", index };
          const selectedFrom =
            selection && sameLoc(selection.from, loc) ? cards.length - selection.count : Number.POSITIVE_INFINITY;
          const runStart = cards.length - runLength(cards);
          const fan = `min(var(--fan-max), max(var(--fan-min), (var(--avail-h) - var(--card-h)) / ${Math.max(1, cards.length - 1)}))`;
          return (
            <div
              key={index}
              {...pileProps(loc, cards)}
              className={cn(pileClass, "w-[var(--card-w)] cursor-pointer")}
              style={{ "--fan": fan, height: `calc(var(--card-h) + var(--fan) * ${Math.max(0, cards.length - 1)})` } as CSSProperties}
            >
              {cards.length === 0 && <CardSlot aria-hidden />}
              {cards.map((card, i) => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  aria-hidden
                  data-run={i >= runStart || undefined}
                  selected={i >= selectedFrom}
                  className="absolute left-0"
                  style={{ top: `calc(var(--fan) * ${i})` }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onActivate(loc, i);
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    if (i === cards.length - 1) onQuickMove(loc);
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
});
