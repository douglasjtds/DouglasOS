"use client";

import {
  memo,
  useEffect,
  useRef,
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useTranslations } from "next-intl";
import type { MinesCell, MinesGame, MinesStatus } from "@/lib/games/mines/engine";
import { cn } from "@/lib/utils";
import { FlagIcon, MineIcon, WrongFlagIcon } from "./MinesIcons";
import type { MinesAction } from "./useMinesGame";

/** Press-and-hold on touch flags a cell (DESKTOP-INTERFACE-SPEC §11). */
export const HOLD_TO_FLAG_MS = 400;
const HOLD_MOVE_TOLERANCE = 10;

const NUMBER_CLASS = [
  "",
  "text-mines-1",
  "text-mines-2",
  "text-mines-3",
  "text-mines-4",
  "text-mines-5",
  "text-mines-6",
  "text-mines-7",
  "text-mines-8",
];

const raised = "bg-button-face shadow-bevel-raised active:shadow-none";
const flat = "bg-button-face shadow-[inset_1px_1px_var(--color-bevel-shadow)]";

type CellLabelKey = "hidden" | "flagged" | "question" | "empty" | "number" | "mine" | "exploded" | "wrongFlag";

const MinesCellView = memo(
  function MinesCellView({
    index,
    row,
    col,
    cell,
    status,
    exploded,
    focusable,
  }: {
    index: number;
    row: number;
    col: number;
    cell: MinesCell;
    status: MinesStatus;
    exploded: boolean;
    focusable: boolean;
  }) {
    const t = useTranslations("games.mines.cell");
    const lost = status === "lost";
    let key: CellLabelKey;
    let look: string;
    let content = null;
    if (cell.state === "revealed") {
      if (cell.mine) {
        key = exploded ? "exploded" : "mine";
        look = exploded ? "bg-icon-error" : flat;
        content = <MineIcon className="size-[70%]" />;
      } else if (cell.adjacent > 0) {
        key = "number";
        look = cn(flat, NUMBER_CLASS[cell.adjacent]);
        content = cell.adjacent;
      } else {
        key = "empty";
        look = flat;
      }
    } else if (lost && cell.mine && cell.state !== "flagged") {
      key = "mine";
      look = flat;
      content = <MineIcon className="size-[70%]" />;
    } else if (lost && cell.state === "flagged" && !cell.mine) {
      key = "wrongFlag";
      look = raised;
      content = <WrongFlagIcon className="size-[70%]" />;
    } else if (cell.state === "flagged") {
      key = "flagged";
      look = raised;
      content = <FlagIcon className="size-[65%]" />;
    } else if (cell.state === "question") {
      key = "question";
      look = raised;
      content = "?";
    } else {
      key = "hidden";
      look = raised;
    }
    return (
      <div
        role="gridcell"
        data-cell
        data-index={index}
        data-state={key}
        tabIndex={focusable ? 0 : -1}
        aria-label={t(key, { row: row + 1, col: col + 1, count: cell.adjacent })}
        className={cn(
          "flex size-(--mines-cell) items-center justify-center font-bold leading-none",
          "focus-light focus-visible:relative focus-visible:z-10 focus-visible:-outline-offset-2",
          look,
        )}
      >
        {content}
      </div>
    );
  },
  (a, b) =>
    a.index === b.index &&
    a.cell.state === b.cell.state &&
    a.cell.mine === b.cell.mine &&
    a.cell.adjacent === b.cell.adjacent &&
    a.status === b.status &&
    a.exploded === b.exploded &&
    a.focusable === b.focusable,
);

/**
 * The minefield as an ARIA grid with a roving tabindex. Pointer, touch and
 * keyboard input are delegated here (one set of handlers for every cell):
 * click / tap reveals (or chords a number), right-click, press-and-hold, F
 * or flag mode flags, middle-click chords, arrows move the focus.
 */
export function MinesBoard({
  game,
  dispatch,
  focus,
  onFocusChange,
  flagMode,
  onPressingChange,
  cellSize,
}: {
  game: MinesGame;
  dispatch: Dispatch<MinesAction>;
  focus: number;
  onFocusChange: (index: number) => void;
  flagMode: boolean;
  onPressingChange: (pressing: boolean) => void;
  /** CSS length for one cell. */
  cellSize: string;
}) {
  const t = useTranslations("games.mines");
  const { rows, cols, mines } = game.config;
  const gridRef = useRef<HTMLDivElement>(null);
  const hold = useRef<{ timer: ReturnType<typeof setTimeout> | null; x: number; y: number; fired: boolean }>({
    timer: null,
    x: 0,
    y: 0,
    fired: false,
  });
  const lastTouch = useRef(0);
  const over = game.status === "won" || game.status === "lost";

  // Keep DOM focus on the roving cell while the grid owns the focus.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !grid.contains(document.activeElement)) return;
    const el = grid.querySelector<HTMLElement>(`[data-index="${focus}"]`);
    if (el && el !== document.activeElement) el.focus();
  }, [focus]);

  useEffect(() => () => clearHold(), []);

  function clearHold() {
    if (hold.current.timer) clearTimeout(hold.current.timer);
    hold.current.timer = null;
  }

  function indexFrom(target: EventTarget | null): number | null {
    const el = (target as Element | null)?.closest?.("[data-cell]");
    if (!el) return null;
    return Number(el.getAttribute("data-index"));
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const index = indexFrom(e.target);
    if (index === null) return;
    hold.current.fired = false;
    const touch = e.pointerType === "touch" || e.pointerType === "pen";
    if (touch) lastTouch.current = Date.now();
    if (e.button !== 0 || over) return;
    if (game.cells[index].state !== "revealed") onPressingChange(true);
    if (touch && game.cells[index].state !== "revealed") {
      clearHold();
      hold.current.x = e.clientX;
      hold.current.y = e.clientY;
      hold.current.timer = setTimeout(() => {
        hold.current.timer = null;
        hold.current.fired = true;
        onPressingChange(false);
        dispatch({ type: "flag", index });
      }, HOLD_TO_FLAG_MS);
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!hold.current.timer) return;
    const dx = e.clientX - hold.current.x;
    const dy = e.clientY - hold.current.y;
    if (Math.hypot(dx, dy) > HOLD_MOVE_TOLERANCE) {
      clearHold();
      onPressingChange(false);
    }
  }

  function endPress() {
    clearHold();
    onPressingChange(false);
  }

  function onClick(e: MouseEvent<HTMLDivElement>) {
    const index = indexFrom(e.target);
    if (index === null) return;
    if (hold.current.fired) {
      hold.current.fired = false;
      return;
    }
    onFocusChange(index);
    if (flagMode && game.cells[index].state !== "revealed") dispatch({ type: "flag", index });
    else dispatch({ type: "activate", index });
  }

  function onMouseDown(e: MouseEvent<HTMLDivElement>) {
    // Middle button: no autoscroll, it chords instead (see onAuxClick).
    if (e.button === 1) e.preventDefault();
  }

  function onAuxClick(e: MouseEvent<HTMLDivElement>) {
    const index = indexFrom(e.target);
    if (index === null || e.button !== 1) return;
    dispatch({ type: "chord", index });
  }

  function onContextMenu(e: MouseEvent<HTMLDivElement>) {
    const index = indexFrom(e.target);
    if (index === null) return;
    e.preventDefault();
    // A long-press on touch fires contextmenu too: the hold timer handles it.
    if (Date.now() - lastTouch.current < 1000) return;
    onFocusChange(index);
    dispatch({ type: "flag", index });
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // Leave modified keys to the shell (Alt+Shift+Arrow maximize/restore…).
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const row = Math.floor(focus / cols);
    const col = focus % cols;
    let next: number | null = null;
    switch (e.key) {
      case "ArrowUp":
        next = Math.max(0, row - 1) * cols + col;
        break;
      case "ArrowDown":
        next = Math.min(rows - 1, row + 1) * cols + col;
        break;
      case "ArrowLeft":
        next = row * cols + Math.max(0, col - 1);
        break;
      case "ArrowRight":
        next = row * cols + Math.min(cols - 1, col + 1);
        break;
      case "Home":
        next = e.ctrlKey ? 0 : row * cols;
        break;
      case "End":
        next = e.ctrlKey ? rows * cols - 1 : row * cols + cols - 1;
        break;
      case "PageUp":
        next = col;
        break;
      case "PageDown":
        next = (rows - 1) * cols + col;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        dispatch({ type: "activate", index: focus });
        return;
      case "f":
      case "F":
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault();
        dispatch({ type: "flag", index: focus });
        return;
      default:
        return;
    }
    e.preventDefault();
    onFocusChange(next);
  }

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label={t("board", { rows, cols, mines })}
      aria-rowcount={rows}
      aria-colcount={cols}
      data-mines-grid
      data-status={game.status}
      data-seed={game.seed}
      style={{ "--mines-cell": cellSize, fontSize: `calc(${cellSize} * 0.6)` } as CSSProperties}
      className="inline-flex touch-manipulation select-none flex-col bg-bevel-shadow p-0.5 shadow-bevel-sunken [-webkit-touch-callout:none]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onPointerLeave={endPress}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onAuxClick={onAuxClick}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        const index = indexFrom(e.target);
        if (index !== null && index !== focus) onFocusChange(index);
      }}
    >
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} role="row" aria-rowindex={r + 1} className="flex">
          {Array.from({ length: cols }, (_, c) => {
            const index = r * cols + c;
            return (
              <MinesCellView
                key={index}
                index={index}
                row={r}
                col={c}
                cell={game.cells[index]}
                status={game.status}
                exploded={game.exploded === index}
                focusable={focus === index}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
