"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { GameOverDialog, GameShell, useStandardGameMenu } from "@/components/apps/games/shared/GameShell";
import { CardSlot, PlayingCard, useCardLabel } from "@/components/apps/games/shared/PlayingCard";
import { CELEBRATION_MS, Celebration } from "@/components/apps/games/spider/Celebration";
import { tableMetrics } from "@/components/apps/games/spider/layout";
import { SpiderColumn } from "@/components/apps/games/spider/SpiderColumn";
import { SpiderIcon } from "@/components/icons/GameIcons";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { randomSeed } from "@/lib/games/rng";
import {
  COLUMN_COUNT,
  bestDestination,
  canPickUp,
  dealBlock,
  dealsLeft,
  findHint,
  isLegalMove,
  isWon,
  score,
  SUIT_COUNTS,
  type Move,
  type SuitCount,
} from "@/lib/games/spider/engine";
import { canUndo, newGame, spiderReducer, type SpiderAction, type SpiderGame } from "@/lib/games/spider/history";

interface Selection {
  col: number;
  index: number;
}

interface Cursor {
  col: number;
  /** Card index; clamped to the column's top card when out of range. */
  index: number;
}

/** Track an element's content size with a ResizeObserver. */
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/**
 * Spider Solitaire (stage 12): ten columns, two decks, 1/2/4 suits. Click or
 * tap a run to pick it up and a column to drop it; double-click sends a run
 * to its best column; the keyboard roves over the columns (arrows), picks and
 * drops with Enter/Space, and cancels with Esc. D deals a row, H hints.
 */
export default function SpiderApp() {
  const t = useTranslations("games.spider");
  const tc = useTranslations("apps.games.common");
  const cardLabel = useCardLabel();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();

  const [suitCount, setSuitCount] = useState<SuitCount>(1);
  const [game, setGame] = useState<SpiderGame>(() => newGame(randomSeed(), 1));
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [message, setMessage] = useState("");
  const [cursor, setCursor] = useState<Cursor>({ col: 0, index: Number.MAX_SAFE_INTEGER });
  const [celebrating, setCelebrating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const focusPending = useRef(false);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tableRef, size] = useElementSize<HTMLDivElement>();

  const { state } = game;
  const metrics = tableMetrics(size.width, isMobile);
  const { cardW, cardH, gap, pad } = metrics;
  const columnsArea = size.height > 0 ? size.height - 3 * pad - cardH : 0;

  useEffect(() => () => {
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
  }, []);

  /** Apply an action; react to run completions and the win. */
  const dispatch = useCallback(
    (action: SpiderAction) => {
      const next = spiderReducer(game, action);
      setSelection(null);
      setHint(null);
      if (next === game) return false;
      setGame(next);
      setMessage(next.state.completed.length > game.state.completed.length ? t("message.runCompleted") : "");
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
      setCelebrating(false);
      setDialogOpen(false);
      if (action.type !== "new" && action.type !== "undo" && isWon(next.state)) {
        if (reducedMotion) {
          setDialogOpen(true);
        } else {
          setCelebrating(true);
          celebrationTimer.current = setTimeout(() => {
            setCelebrating(false);
            setDialogOpen(true);
          }, CELEBRATION_MS);
        }
      }
      return true;
    },
    [game, reducedMotion, t],
  );

  const startNewGame = useCallback(
    (suits: SuitCount = suitCount) => {
      setSuitCount(suits);
      dispatch({ type: "new", seed: randomSeed(), suitCount: suits });
      setMessage("");
      setCursor({ col: 0, index: Number.MAX_SAFE_INTEGER });
    },
    [dispatch, suitCount],
  );

  const undo = useCallback(() => {
    dispatch({ type: "undo" });
  }, [dispatch]);

  const dealRowAction = useCallback(() => {
    const block = dealBlock(state);
    if (block) {
      setSelection(null);
      setHint(null);
      setMessage(block === "empty-column" ? t("message.emptyColumn") : t("message.noStock"));
      return;
    }
    dispatch({ type: "deal" });
  }, [dispatch, state, t]);

  const showHint = useCallback(() => {
    setSelection(null);
    const move = findHint(state);
    setHint(move);
    if (move) {
      setMessage(
        t("message.hint", { card: cardLabel(state.columns[move.from][move.index].card), column: move.to + 1 }),
      );
    } else {
      setMessage(dealBlock(state) === "empty-stock" ? t("message.noMoves") : t("message.noMovesDeal"));
    }
  }, [cardLabel, state, t]);

  const tryMove = useCallback(
    (from: number, index: number, to: number) => {
      if (!isLegalMove(state, { from, index, to })) {
        setSelection(null);
        setHint(null);
        setMessage(t("message.illegal"));
        return false;
      }
      return dispatch({ type: "move", move: { from, index, to } });
    },
    [dispatch, state, t],
  );

  /** Click / tap / Enter on a card (index ≥ 0) or an empty column (-1). */
  const activate = useCallback(
    (col: number, index: number) => {
      setCursor({ col, index });
      setHint(null);
      if (selection) {
        if (selection.col !== col) {
          tryMove(selection.col, selection.index, col);
          return;
        }
        if (index >= 0 && index !== selection.index && canPickUp(state.columns[col], index)) {
          setSelection({ col, index });
          setMessage(t("message.selected", { card: cardLabel(state.columns[col][index].card) }));
          return;
        }
        setSelection(null);
        setMessage("");
        return;
      }
      if (index < 0) return;
      if (canPickUp(state.columns[col], index)) {
        setSelection({ col, index });
        setMessage(t("message.selected", { card: cardLabel(state.columns[col][index].card) }));
      } else {
        setMessage(t("message.cantPickUp"));
      }
    },
    [cardLabel, selection, state, t, tryMove],
  );

  /** Click on a column's face-down cards or background: drop there. */
  const columnClick = useCallback(
    (col: number) => {
      if (selection && selection.col !== col) tryMove(selection.col, selection.index, col);
    },
    [selection, tryMove],
  );

  const autoMove = useCallback(
    (col: number, index: number) => {
      const to = bestDestination(state, col, index);
      if (to === null) {
        setSelection(null);
        setMessage(canPickUp(state.columns[col], index) ? t("message.noDestination") : t("message.cantPickUp"));
        return;
      }
      setCursor({ col: to, index: Number.MAX_SAFE_INTEGER });
      dispatch({ type: "move", move: { from: col, index, to } });
    },
    [dispatch, state, t],
  );

  // Roving focus: the focusable index per column (only the cursor's column has one).
  const cursorColumn = state.columns[cursor.col];
  const focusIndex = (() => {
    if (cursorColumn.length === 0) return -1;
    const last = cursorColumn.length - 1;
    const index = Math.min(cursor.index, last);
    return cursorColumn[index].faceUp ? index : last;
  })();

  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    tableRef.current
      ?.querySelector<HTMLElement>(`[data-spider-column="${cursor.col}"] [data-spider-index="${focusIndex}"]`)
      ?.focus();
  }, [cursor.col, focusIndex, tableRef, game]);

  const moveCursor = (col: number, index: number) => {
    focusPending.current = true;
    setCursor({ col, index });
  };

  const onTableKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-spider-column]")) return;
    // Leave modified keys to the shell (Alt+Shift+Arrow maximize/restore…).
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const col = cursor.col;
    switch (e.key) {
      case "ArrowLeft":
        moveCursor((col + COLUMN_COUNT - 1) % COLUMN_COUNT, Number.MAX_SAFE_INTEGER);
        break;
      case "ArrowRight":
        moveCursor((col + 1) % COLUMN_COUNT, Number.MAX_SAFE_INTEGER);
        break;
      case "Home":
        moveCursor(0, Number.MAX_SAFE_INTEGER);
        break;
      case "End":
        moveCursor(COLUMN_COUNT - 1, Number.MAX_SAFE_INTEGER);
        break;
      case "ArrowUp":
        if (focusIndex > 0 && canPickUp(cursorColumn, focusIndex - 1)) moveCursor(col, focusIndex - 1);
        break;
      case "ArrowDown":
        if (focusIndex >= 0 && focusIndex < cursorColumn.length - 1) moveCursor(col, focusIndex + 1);
        break;
      case "Enter":
      case " ": {
        const moving = selection && selection.col !== col;
        activate(col, focusIndex);
        if (moving) moveCursor(col, Number.MAX_SAFE_INTEGER);
        break;
      }
      case "Escape":
        if (!selection && !hint) return;
        setSelection(null);
        setHint(null);
        setMessage("");
        break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const onShellKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[role="menu"], [role="menubar"], [role="alertdialog"]')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === "F2") {
      startNewGame();
    } else if (mod && e.key.toLowerCase() === "z") {
      undo();
    } else if (!mod && !e.altKey && e.key.toLowerCase() === "d") {
      dealRowAction();
    } else if (!mod && !e.altKey && e.key.toLowerCase() === "h") {
      showHint();
    } else {
      return;
    }
    e.preventDefault();
  };

  const suitLabels: Record<SuitCount, string> = {
    1: t("menu.suits1"),
    2: t("menu.suits2"),
    4: t("menu.suits4"),
  };
  const gameMenu = useStandardGameMenu({
    game: "spider",
    onNewGame: () => startNewGame(),
    onUndo: undo,
    canUndo: canUndo(game),
    options: [
      { id: "deal", label: t("menu.deal"), onSelect: dealRowAction, shortcut: "D" },
      { id: "hint", label: t("menu.hint"), onSelect: showHint, shortcut: "H" },
      "separator",
      ...SUIT_COUNTS.map((count) => ({
        id: `suits-${count}`,
        label: suitLabels[count],
        checked: suitCount === count,
        onSelect: () => startNewGame(count),
      })),
    ],
  });

  const left = dealsLeft(state);
  const backStep = isMobile ? 4 : 8;
  const kingStep = Math.round(cardW * (isMobile ? 0.28 : 0.35));
  const tableStyle = {
    "--card-w": `${cardW}px`,
    "--card-h": `${cardH}px`,
    padding: pad,
    gap: pad,
  } as CSSProperties;

  const piles = (
    <div className="flex shrink-0 items-start justify-between" style={{ height: cardH }}>
      <div
        data-spider-completed={state.completed.length}
        role="img"
        aria-label={t("completed", { count: state.completed.length })}
        className="relative"
        style={{ width: cardW + kingStep * Math.max(0, state.completed.length - 1), height: cardH }}
      >
        {state.completed.length === 0 ? (
          <CardSlot />
        ) : (
          state.completed.map((suit, i) => (
            <PlayingCard
              key={i}
              card={{ id: `completed-${i}`, suit, rank: 13 }}
              className="absolute top-0"
              style={{ left: i * kingStep }}
            />
          ))
        )}
      </div>
      <button
        type="button"
        data-spider-stock={left}
        aria-label={left > 0 ? t("stock", { count: left }) : t("stockEmpty")}
        onClick={dealRowAction}
        className="relative block rounded-card focus-light"
        style={{ width: cardW + backStep * Math.max(0, left - 1), height: cardH }}
      >
        {left === 0 ? (
          <CardSlot />
        ) : (
          Array.from({ length: left }, (_, i) => (
            <PlayingCard
              key={i}
              card={state.stock[i * COLUMN_COUNT]}
              faceDown
              className="absolute top-0"
              style={{ left: i * backStep }}
            />
          ))
        )}
      </button>
    </div>
  );

  const selectionStart = selection?.index ?? null;

  return (
    <GameShell
      game="spider"
      menus={[gameMenu]}
      bodyClassName="bg-felt-gradient overflow-hidden"
      onKeyDown={onShellKeyDown}
      status={[
        tc("score", { score: score(state) }),
        tc("moves", { moves: state.moves }),
        <span key="message" data-spider-message className="truncate" title={message || undefined}>
          {message || t("runs", { count: state.completed.length })}
        </span>,
      ]}
    >
      <div
        ref={tableRef}
        role="region"
        aria-label={t("table")}
        data-spider-table
        data-suits={state.suitCount}
        data-spider-moves={state.moves}
        className="absolute inset-0 flex flex-col"
        style={tableStyle}
      >
        {isMobile && piles}
        <div
          className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto"
          style={{ gap }}
          onKeyDown={onTableKeyDown}
        >
          {state.columns.map((column, col) => (
            <SpiderColumn
              key={col}
              column={column}
              index={col}
              cardH={cardH}
              available={columnsArea}
              selectedFrom={selection?.col === col ? selectionStart : null}
              hintFrom={hint?.from === col ? hint.index : null}
              hintTarget={hint?.to === col}
              focusIndex={cursor.col === col ? focusIndex : null}
              onActivate={activate}
              onAutoMove={autoMove}
              onColumnClick={columnClick}
            />
          ))}
        </div>
        {!isMobile && piles}
        {celebrating && <Celebration suits={state.completed} />}
      </div>
      <GameOverDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={tc("won")}
        message={t("wonMessage", { score: score(state) })}
        icon={<SpiderIcon size={32} />}
        onPlayAgain={() => startNewGame()}
      />
    </GameShell>
  );
}
