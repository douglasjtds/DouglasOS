"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { GameOverDialog, GameShell, useStandardGameMenu } from "@/components/apps/games/shared/GameShell";
import { SolitaireBoard, focusKey } from "@/components/apps/games/solitaire/SolitaireBoard";
import { WinCascade, cascadeDuration } from "@/components/apps/games/solitaire/WinCascade";
import { gameReducer } from "@/components/apps/games/solitaire/gameReducer";
import { SolitaireIcon } from "@/components/icons/GameIcons";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { randomSeed } from "@/lib/games/rng";
import {
  COLUMN_COUNT,
  canAutoComplete,
  canFlip,
  canMove,
  canUndo,
  deal,
  foundationTargetFor,
  isWon,
  type DrawCount,
  type SolitaireState,
  type Source,
  type Target,
} from "@/lib/games/solitaire/engine";
import {
  TABLEAU_PILE,
  clampFocus,
  moveFocus,
  tableMetrics,
  type FocusPos,
  type NavKey,
} from "@/lib/games/solitaire/layout";
import { useWindowStore } from "@/lib/store/windowStore";

const NAV_KEYS = new Set<string>(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);
const AUTO_STEP_MS = 90;
/** Size used before the play area is measured (and in jsdom). */
const FALLBACK_SIZE = { width: 560, height: 420 };

function targetForPile(pile: number): Target | null {
  if (pile >= 2 && pile < TABLEAU_PILE) return { kind: "foundation", index: pile - 2 };
  if (pile >= TABLEAU_PILE && pile < TABLEAU_PILE + COLUMN_COUNT) return { kind: "tableau", index: pile - TABLEAU_PILE };
  return null;
}

function sameSource(a: Source | null, b: Source | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function usePlayAreaSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(FALLBACK_SIZE);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        setSize((s) =>
          s.width === el.clientWidth && s.height === el.clientHeight
            ? s
            : { width: el.clientWidth, height: el.clientHeight },
        );
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/**
 * Solitaire (Klondike), stage 12: draw one / draw three, unlimited redeals,
 * standard scoring, undo, double-click (or A) to the foundations,
 * auto-finish, click-to-select + click-to-drop with keyboard and drag paths.
 */
export default function SolitaireApp({
  seed,
  initialState,
}: {
  /** Deal seed for the first game (tests). */
  seed?: number;
  /** A ready-made first position (tests). */
  initialState?: SolitaireState;
} = {}) {
  const t = useTranslations("games.solitaire");
  const tc = useTranslations("apps.games.common");
  const tApp = useTranslations("apps.solitaire");
  const reduced = useReducedMotion();
  const minimized = useWindowStore((s) => s.windows.solitaire?.minimized ?? false);

  const [drawCount, setDrawCount] = useState<DrawCount>(1);
  const [game, dispatch] = useReducer(gameReducer, undefined, () => initialState ?? deal(seed ?? randomSeed(), 1));
  const [selection, setSelection] = useState<Source | null>(null);
  const [rawFocus, setFocus] = useState<FocusPos>({ pile: 0, card: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [autoRunning, setAutoRunning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [areaRef, size] = usePlayAreaSize();
  const boardRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);

  const focus = clampFocus(game, rawFocus);
  const won = isWon(game);
  const metrics = tableMetrics(size.width);

  // ---- Clock: starts with the first move, stops on win / while minimized.
  const running = game.moves > 0 && !won && !minimized;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // ---- Win: celebrate (unless reduced motion), then the dialog.
  useEffect(() => {
    if (!won) return;
    const id = window.setTimeout(() => setDialogOpen(true), reduced ? 0 : cascadeDuration(52));
    return () => window.clearTimeout(id);
  }, [won, reduced]);

  // ---- Auto-finish, one card per tick.
  useEffect(() => {
    if (!autoRunning || !canAutoComplete(game)) return;
    const id = window.setTimeout(() => dispatch({ type: "autoStep" }), AUTO_STEP_MS);
    return () => window.clearTimeout(id);
  }, [autoRunning, game]);

  // ---- Keep the DOM focus on the roving position after keyboard moves.
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    boardRef.current?.querySelector<HTMLElement>(`[data-focus-key="${focusKey(game, focus)}"]`)?.focus();
  });

  const newGame = useCallback(
    (count: DrawCount = drawCount) => {
      setDrawCount(count);
      setSelection(null);
      setElapsed(0);
      setAutoRunning(false);
      setDialogOpen(false);
      setFocus({ pile: 0, card: 0 });
      dispatch({ type: "new", seed: randomSeed(), drawCount: count });
    },
    [drawCount],
  );

  const doUndo = useCallback(() => {
    setSelection(null);
    setAutoRunning(false);
    dispatch({ type: "undo" });
  }, []);

  /** Refocus after an action that may replace the focused element. */
  const keepFocus = () => {
    if (boardRef.current?.contains(document.activeElement)) pendingFocus.current = true;
  };

  /** Click / tap / Enter on a pile: draw, flip, select, or drop the selection. */
  const activate = (pile: number, card?: number) => {
    setFocus({ pile, card: card ?? 0 });
    keepFocus();
    if (pile === 0) {
      setSelection(null);
      dispatch({ type: "stock" });
      return;
    }
    if (pile === 1) {
      setSelection(selection?.kind === "waste" || game.waste.length === 0 ? null : { kind: "waste" });
      return;
    }
    const target = targetForPile(pile);
    if (!target) return;
    if (selection) {
      const move = { from: selection, to: target };
      if (canMove(game, move)) {
        setSelection(null);
        dispatch({ type: "move", move });
        return;
      }
    }
    if (target.kind === "foundation") {
      const next: Source | null =
        game.foundations[target.index].length > 0 ? { kind: "foundation", index: target.index } : null;
      setSelection(sameSource(selection, next) ? null : next);
      return;
    }
    if (canFlip(game, target.index)) {
      setSelection(null);
      dispatch({ type: "flip", index: target.index });
      return;
    }
    const column = game.tableau[target.index];
    if (card === undefined || column.faceUp.length === 0) {
      setSelection(null);
      return;
    }
    const next: Source = { kind: "tableau", index: target.index, start: Math.min(card, column.faceUp.length - 1) };
    setSelection(sameSource(selection, next) ? null : next);
  };

  const toFoundation = (from: Source) => {
    setSelection(null);
    keepFocus();
    dispatch({ type: "toFoundation", from });
  };

  const drop = (from: Source, pile: number) => {
    const to = targetForPile(pile);
    setSelection(null);
    if (to && canMove(game, { from, to })) dispatch({ type: "move", move: { from, to } });
  };

  /** "A": the selection, or the focused pile's top card, to its foundation. */
  const sendFocusedHome = () => {
    let from: Source | null = selection;
    if (!from) {
      if (focus.pile === 1) from = { kind: "waste" };
      else if (focus.pile >= TABLEAU_PILE) {
        const column = game.tableau[focus.pile - TABLEAU_PILE];
        if (column.faceUp.length > 0) from = { kind: "tableau", index: focus.pile - TABLEAU_PILE, start: column.faceUp.length - 1 };
      }
    }
    if (from && foundationTargetFor(game, from)) toFoundation(from);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Keys typed in the win box or a menu must not change the board behind it.
    if ((e.target as HTMLElement).closest('[role="alertdialog"], [role="dialog"], [role="menu"]')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === "F2") {
      e.preventDefault();
      newGame();
      return;
    }
    if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      doUndo();
      return;
    }
    // Everything else only from inside the table (not menus or the dialog).
    if (!boardRef.current?.contains(e.target as Node) || mod || e.altKey) return;
    if (NAV_KEYS.has(e.key)) {
      e.preventDefault();
      pendingFocus.current = true;
      setFocus(moveFocus(game, focus, e.key as NavKey));
    } else if (e.key === "Escape" && selection) {
      e.preventDefault();
      setSelection(null);
    } else if (e.key.toLowerCase() === "a") {
      e.preventDefault();
      sendFocusedHome();
    }
  };

  const changeDraw = (count: DrawCount) => newGame(count);
  const gameMenu = useStandardGameMenu({
    game: "solitaire",
    onNewGame: () => newGame(),
    onUndo: doUndo,
    canUndo: canUndo(game),
    options: [
      { id: "draw-one", label: t("drawOne"), checked: drawCount === 1, onSelect: () => changeDraw(1) },
      { id: "draw-three", label: t("drawThree"), checked: drawCount === 3, onSelect: () => changeDraw(3) },
    ],
  });

  const offerFinish = canAutoComplete(game) && !autoRunning;
  const finish = () => {
    setSelection(null);
    if (reduced) dispatch({ type: "autoAll" });
    else setAutoRunning(true);
  };

  const tableStyle = { "--card-w": `${metrics.cardW}px`, "--card-h": `${metrics.cardH}px` } as CSSProperties;

  return (
    <GameShell
      game="solitaire"
      menus={[gameMenu]}
      bodyClassName="bg-felt-gradient"
      onKeyDown={onKeyDown}
      status={[
        <span key="score" data-solitaire-score={game.score}>{tc("score", { score: game.score })}</span>,
        <span key="moves" data-solitaire-moves={game.moves}>{tc("moves", { moves: game.moves })}</span>,
        // The clock ticks every second: keep it out of the status live region.
        <span key="time" aria-live="off">{tc("time", { seconds: elapsed })}</span>,
      ]}
    >
      <div ref={areaRef} className="h-full w-full" style={tableStyle}>
        <div
          ref={boardRef}
          role="group"
          aria-label={t("board")}
          aria-describedby="solitaire-instructions"
          data-solitaire-draw={drawCount}
        >
          <p id="solitaire-instructions" className="sr-only">
            {t("instructions")}
          </p>
          <SolitaireBoard
            game={game}
            metrics={metrics}
            height={size.height}
            selection={selection}
            focus={focus}
            celebrating={won && !reduced}
            onActivate={activate}
            onToFoundation={toFoundation}
            onDrop={drop}
            onFocus={setFocus}
          >
            {won && !reduced && <WinCascade foundations={game.foundations} metrics={metrics} height={size.height} />}
            {offerFinish && (
              <Button
                data-solitaire-action="finish"
                aria-label={t("autoFinishLabel")}
                className="absolute bottom-2 left-1/2 z-400 -translate-x-1/2"
                onClick={finish}
              >
                {t("autoFinish")}
              </Button>
            )}
          </SolitaireBoard>
        </div>
      </div>
      <GameOverDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={tApp("title")}
        icon={<SolitaireIcon size={32} />}
        message={t("wonMessage", { score: game.score, seconds: elapsed })}
        onPlayAgain={() => newGame()}
      />
    </GameShell>
  );
}
