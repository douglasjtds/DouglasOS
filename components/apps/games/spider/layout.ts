/**
 * Table geometry for Spider Solitaire: card size from the board width (ten
 * columns must fit a 390px phone) and per-column fan offsets compressed to
 * fit the available height (face-down cards tighter than face-up ones).
 */
import { COLUMN_COUNT, type Column } from "@/lib/games/spider/engine";

/** Card aspect ratio from the `card-w` / `card-h` tokens (71 × 96). */
const CARD_RATIO = 96 / 71;
const MAX_CARD_W = 71;
const MIN_CARD_W = 30;

export interface TableMetrics {
  cardW: number;
  cardH: number;
  gap: number;
  pad: number;
}

/** Card size for a board `width` px wide (0 = not measured yet: desktop default). */
export function tableMetrics(width: number, mobile: boolean): TableMetrics {
  const gap = mobile ? 3 : 8;
  const pad = mobile ? 4 : 10;
  const fit = Math.floor((width - 2 * pad - (COLUMN_COUNT - 1) * gap) / COLUMN_COUNT);
  const cardW = width > 0 ? Math.max(MIN_CARD_W, Math.min(MAX_CARD_W, fit)) : MAX_CARD_W;
  return { cardW, cardH: Math.round(cardW * CARD_RATIO), gap, pad };
}

export interface FanOffsets {
  /** Vertical step after a face-down card. */
  down: number;
  /** Vertical step after a face-up card. */
  up: number;
}

/**
 * Preferred and minimum steps for a card height. A face-up step must show
 * the corner rank and suit (the corner text never goes below 9px, so ~22px
 * on small cards); the minimum still shows the rank.
 */
export function fanLimits(cardH: number) {
  return {
    up: Math.max(22, Math.round(cardH * 0.3)),
    minUp: Math.max(13, Math.round(cardH * 0.16)),
    down: Math.max(5, Math.round(cardH * 0.1)),
    minDown: 3,
  };
}

/** Offsets that make `column` fit in `available` px (as far as the minimums allow). */
export function fanOffsets(column: Column, cardH: number, available: number): FanOffsets {
  const limits = fanLimits(cardH);
  const faceDown = column.filter((c) => !c.faceUp).length;
  const faceUpSteps = Math.max(0, column.length - faceDown - 1);
  let down = limits.down;
  let up = limits.up;
  const height = () => cardH + faceDown * down + faceUpSteps * up;
  if (available > 0 && height() > available && faceUpSteps > 0) {
    up = Math.max(limits.minUp, Math.min(up, Math.floor((available - cardH - faceDown * down) / faceUpSteps)));
  }
  if (available > 0 && height() > available && faceDown > 0) {
    down = Math.max(limits.minDown, Math.min(down, Math.floor((available - cardH - faceUpSteps * up) / faceDown)));
  }
  return { down, up };
}

/** Top offset of every card in `column`, plus the column's total height. */
export function fanPositions(column: Column, cardH: number, offsets: FanOffsets) {
  const tops: number[] = [];
  let y = 0;
  column.forEach((c, i) => {
    tops.push(y);
    if (i < column.length - 1) y += c.faceUp ? offsets.up : offsets.down;
  });
  return { tops, height: column.length > 0 ? y + cardH : cardH };
}
