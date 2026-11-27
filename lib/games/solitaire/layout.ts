/**
 * Table geometry and keyboard navigation for the Solitaire UI. Pure, so the
 * sizing rules (fit a 390px phone, tighten fans in tall columns) and the
 * roving-focus moves are unit-tested without a DOM.
 */
import type { Board } from "./engine";

export const CARD_RATIO = 96 / 71;
const MAX_CARD_W = 71;
const MIN_CARD_W = 30;

export interface TableMetrics {
  cardW: number;
  cardH: number;
  gap: number;
  pad: number;
  /** Top of the tableau row. */
  tableauTop: number;
  /** Horizontal step of the draw-three waste fan. */
  wasteFan: number;
}

/** Card size and spacing so seven columns fit the play area width. */
export function tableMetrics(width: number): TableMetrics {
  const gap = width < 500 ? 4 : 10;
  const pad = gap;
  const fit = Math.floor((width - 2 * pad - 6 * gap) / 7);
  const cardW = Math.max(MIN_CARD_W, Math.min(MAX_CARD_W, fit));
  const cardH = Math.round(cardW * CARD_RATIO);
  return {
    cardW,
    cardH,
    gap,
    pad,
    tableauTop: pad + cardH + gap * 2,
    wasteFan: Math.round(cardW * 0.3),
  };
}

/** X of a column (top-row piles share the tableau grid). */
export function columnX(m: TableMetrics, column: number): number {
  return m.pad + column * (m.cardW + m.gap);
}

/**
 * The pile under a point in table coordinates (drag and drop), as a pile
 * index (see `FocusPos`), or null over the gap / outside the grid.
 */
export function pileAtPoint(m: TableMetrics, x: number, y: number): number | null {
  const step = m.cardW + m.gap;
  const column = Math.floor((x - m.pad + m.gap / 2) / step);
  if (column < 0 || column > 6) return null;
  if (y < m.tableauTop - m.gap) {
    if (column === 2) return null;
    return column < 2 ? column : column - 1;
  }
  return TABLEAU_PILE + column;
}

export interface FanOffsets {
  /** Step between face-down cards. */
  down: number;
  /** Step between face-up cards. */
  up: number;
}

/**
 * Vertical steps for one column: roomy by default, tightened (face-up first,
 * never below a readable corner, then face-down) when the column would
 * overflow `available` px.
 */
export function fanOffsets(cardH: number, faceDown: number, faceUp: number, available: number): FanOffsets {
  let down = Math.max(2, Math.round(cardH * 0.1));
  let up = Math.round(cardH * 0.3);
  const minUp = Math.round(cardH * 0.2);
  const height = () => faceDown * down + Math.max(0, faceUp - 1) * up + cardH;
  if (height() <= available) return { down, up };
  if (faceUp > 1) {
    up = Math.max(minUp, Math.floor((available - cardH - faceDown * down) / (faceUp - 1)));
  }
  if (height() > available && faceDown > 0) {
    down = Math.max(1, Math.floor((available - cardH - Math.max(0, faceUp - 1) * up) / faceDown));
  }
  return { down, up };
}

/**
 * Roving focus position. Piles in reading order: 0 stock, 1 waste,
 * 2–5 foundations, 6–12 tableau columns. `card` indexes the column's
 * face-up run (0 when it has none).
 */
export interface FocusPos {
  pile: number;
  card: number;
}

export const PILE_COUNT = 13;
export const TABLEAU_PILE = 6;
/** Top-row pile above each tableau column (column 2 sits under the gap → waste). */
const TOP_FOR_COLUMN = [0, 1, 1, 2, 3, 4, 5];
/** Tableau column under each top-row pile. */
const COLUMN_FOR_TOP = [0, 1, 3, 4, 5, 6];

function lastCard(board: Board, pile: number): number {
  if (pile < TABLEAU_PILE) return 0;
  return Math.max(0, board.tableau[pile - TABLEAU_PILE].faceUp.length - 1);
}

export type NavKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End";

/** Where an arrow key takes the focus. */
export function moveFocus(board: Board, focus: FocusPos, key: NavKey): FocusPos {
  const { pile, card } = focus;
  switch (key) {
    case "ArrowLeft":
    case "ArrowRight": {
      const next = (pile + (key === "ArrowRight" ? 1 : -1) + PILE_COUNT) % PILE_COUNT;
      return { pile: next, card: lastCard(board, next) };
    }
    case "Home":
      return { pile: 0, card: 0 };
    case "End":
      return { pile: PILE_COUNT - 1, card: lastCard(board, PILE_COUNT - 1) };
    case "ArrowDown":
      if (pile < TABLEAU_PILE) {
        const next = TABLEAU_PILE + COLUMN_FOR_TOP[pile];
        return { pile: next, card: lastCard(board, next) };
      }
      return { pile, card: Math.min(card + 1, lastCard(board, pile)) };
    case "ArrowUp":
      if (pile < TABLEAU_PILE) return focus;
      if (card > 0) return { pile, card: card - 1 };
      return { pile: TOP_FOR_COLUMN[pile - TABLEAU_PILE], card: 0 };
  }
}

/** Keep a focus position valid after the board changed. */
export function clampFocus(board: Board, focus: FocusPos): FocusPos {
  return { pile: focus.pile, card: Math.min(focus.card, lastCard(board, focus.pile)) };
}
