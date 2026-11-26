"use client";

import { useCallback, useMemo, useReducer, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { GameOverDialog, GameShell, useStandardGameMenu } from "@/components/apps/games/shared/GameShell";
import {
  FreeCellBoard,
  moveFocus,
  pileAt,
  pileIndex,
  type Selection,
} from "@/components/apps/games/freecell/FreeCellBoard";
import { SelectGameDialog } from "@/components/apps/games/freecell/SelectGameDialog";
import { InfoIcon } from "@/components/icons/SystemIcons";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  canUndo,
  cardsLeft,
  hasLegalMoves,
  isWon,
  newGame,
  play,
  quickMove,
  randomGameNumber,
  resolveMove,
  restart,
  runLength,
  topCard,
  undo,
  type FreeCellGame,
  type Location,
  type Move,
} from "@/lib/games/freecell/engine";

type Action =
  | { type: "new"; gameNumber: number }
  | { type: "restart" }
  | { type: "play"; move: Move }
  | { type: "undo" };

function reducer(game: FreeCellGame, action: Action): FreeCellGame {
  switch (action.type) {
    case "new":
      return newGame(action.gameNumber);
    case "restart":
      return restart(game);
    case "play":
      return play(game, action.move);
    case "undo":
      return undo(game);
  }
}

/**
 * FreeCell (stage 12): numbered seeded deals, four free cells, supermoves,
 * safe auto-moves to the foundations and full undo. Click/tap a card (or a
 * run) and then its destination; double-click sends a card up or to a free
 * cell; the keyboard roves over the 16 piles.
 */
export default function FreeCellApp({ initialGameNumber }: { initialGameNumber?: number } = {}) {
  const t = useTranslations("games.freecell");
  const common = useTranslations("apps.games.common");
  const isMobile = useIsMobile();
  const [game, dispatch] = useReducer(reducer, initialGameNumber, (n) => newGame(n ?? randomGameNumber()));
  const [selection, setSelection] = useState<Selection | null>(null);
  const [focusIndex, setFocusIndex] = useState(8);
  const [hint, setHint] = useState<string | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectKey, setSelectKey] = useState(0);
  // The finished state whose win box was closed (a new game gets a new state).
  const [dismissedWin, setDismissedWin] = useState<FreeCellGame["state"] | null>(null);

  const { state } = game;
  const won = isWon(state);
  const winOpen = won && dismissedWin !== state;
  const stuck = useMemo(() => !won && !hasLegalMoves(state), [state, won]);

  const reset = () => {
    setSelection(null);
    setHint(null);
  };
  const startGame = (gameNumber: number) => {
    reset();
    dispatch({ type: "new", gameNumber });
  };
  const newRandomGame = () => startGame(randomGameNumber());
  const restartGame = () => {
    reset();
    dispatch({ type: "restart" });
  };
  const undoMove = () => {
    reset();
    dispatch({ type: "undo" });
  };

  const commit = useCallback((move: Move) => {
    setSelection(null);
    setHint(null);
    dispatch({ type: "play", move });
  }, []);

  /** Pick up from a pile, or drop the current selection on it. */
  const activate = useCallback(
    (loc: Location, cardIndex?: number) => {
      setFocusIndex(pileIndex(loc));
      if (selection) {
        if (selection.from.kind === loc.kind && selection.from.index === loc.index) {
          setSelection(null);
          return;
        }
        const move = resolveMove(state, selection.from, loc, selection.count);
        if (move) commit(move);
        else {
          setSelection(null);
          setHint(t("invalidMove"));
        }
        return;
      }
      if (loc.kind === "foundation" || !topCard(state, loc)) return;
      let count = 1;
      if (loc.kind === "column" && cardIndex !== undefined) {
        const column = state.columns[loc.index];
        const fromTop = column.length - cardIndex;
        if (fromTop <= runLength(column)) count = fromTop;
      }
      setHint(null);
      setSelection({ from: loc, count });
    },
    [selection, state, commit, t],
  );

  const quick = useCallback(
    (loc: Location) => {
      const move = quickMove(state, loc);
      if (move) commit(move);
      else setSelection(null);
    },
    [state, commit],
  );

  const onBoardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-pile]")) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate(pileAt(focusIndex));
        return;
      }
      if (event.key === "Escape") {
        if (selection) {
          event.preventDefault();
          setSelection(null);
        }
        return;
      }
      const next = moveFocus(focusIndex, event.key);
      if (next !== focusIndex || event.key.startsWith("Arrow")) {
        event.preventDefault();
        setFocusIndex(next);
        event.currentTarget.querySelector<HTMLElement>(`[data-pile-index="${next}"]`)?.focus();
      }
    },
    [activate, focusIndex, selection],
  );

  const onShellKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Keys typed in the (portaled) dialogs bubble here through React: ignore them.
    if (selectOpen || winOpen) return;
    if (event.key === "F2") {
      event.preventDefault();
      newRandomGame();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (canUndo(game)) undoMove();
    }
  };

  const gameMenu = useStandardGameMenu({
    game: "freecell",
    onNewGame: newRandomGame,
    onUndo: undoMove,
    canUndo: canUndo(game),
  });
  // Insert "Select game…" and "Restart this game" right after New game.
  const menus = [
    {
      ...gameMenu,
      items: [
        gameMenu.items[0],
        { id: "select", label: t("selectGame"), onSelect: () => {
          setSelectKey((k) => k + 1);
          setSelectOpen(true);
        } },
        { id: "restart", label: t("restart"), onSelect: restartGame },
        ...gameMenu.items.slice(1),
      ],
    },
  ];

  const status = [
    t("gameNumber", { number: state.gameNumber }),
    t("cardsLeft", { count: cardsLeft(state) }),
    common("moves", { moves: state.moves }),
  ];
  const message = hint ?? (stuck ? t("noMoves") : null);
  if (message) status.push(message);

  return (
    <GameShell game="freecell" menus={menus} status={status} bodyClassName="bg-felt-gradient" onKeyDown={onShellKeyDown}>
      <FreeCellBoard
        state={state}
        selection={selection}
        focusIndex={focusIndex}
        isMobile={isMobile}
        onActivate={activate}
        onQuickMove={quick}
        onFocusChange={setFocusIndex}
        onKeyDown={onBoardKeyDown}
      />
      <SelectGameDialog
        key={selectKey}
        open={selectOpen}
        onOpenChange={setSelectOpen}
        initialNumber={state.gameNumber}
        onSelect={startGame}
      />
      <GameOverDialog
        open={winOpen}
        onOpenChange={(open) => !open && setDismissedWin(state)}
        title={common("won")}
        message={t("wonMessage", { number: state.gameNumber, moves: state.moves })}
        icon={<InfoIcon size={32} />}
        onPlayAgain={newRandomGame}
      />
    </GameShell>
  );
}
