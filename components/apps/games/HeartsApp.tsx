"use client";

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { Card } from "@/lib/games/cards";
import {
  HUMAN,
  PASS_COUNT,
  SEATS,
  illegalReason,
  isTrickComplete,
  legalPlays,
  passDirection,
  passTarget,
  trickWinner,
  winners,
  type HeartsState,
} from "@/lib/games/hearts/engine";
import { GameShell, useStandardGameMenu, type GameMenu } from "@/components/apps/games/shared/GameShell";
import { PlayerHand, type HandMode } from "@/components/apps/games/hearts/PlayerHand";
import { Opponent, TrickArea } from "@/components/apps/games/hearts/Table";
import { RulesDialog, ScoreSheet } from "@/components/apps/games/hearts/Dialogs";
import { useHeartsGame } from "@/components/apps/games/hearts/useHeartsGame";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const PASS_KEYS = { left: "passLeft", right: "passRight", across: "passAcross" } as const;

/**
 * Hearts (stage 12): you (South) against three computer players. The engine
 * in `lib/games/hearts` owns every rule; this component renders the table,
 * collects the human's pass and plays, and shows the score sheet between
 * hands. Computer turns are paced by `useHeartsGame`.
 */
export default function HeartsApp({ initialSeed }: { initialSeed?: number } = {}) {
  const t = useTranslations("games.hearts");
  const reducedMotion = useReducedMotion();
  const { state, newGame, nextHand: dealNextHand, pass, play } = useHeartsGame({ reducedMotion, initialSeed });

  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  /** A transient hint (illegal play…) tied to the state it was raised in. */
  const [notice, setNotice] = useState<{ text: string; state: HeartsState } | null>(null);
  /** The hand whose score sheet the player closed, so it stays closed. */
  const [sheetDismissed, setSheetDismissed] = useState<number | null>(null);
  const [sheetRequested, setSheetRequested] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const names = useMemo(() => SEATS.map((seat) => t(`players.${seat}`)), [t]);
  const handOver = state.phase === "handOver" || state.phase === "gameOver";
  const sheetOpen = sheetRequested || (handOver && sheetDismissed !== state.handNumber);

  const startNewGame = useCallback(() => {
    newGame();
    setSelected(new Set());
    setNotice(null);
    setSheetDismissed(null);
    setSheetRequested(false);
  }, [newGame]);

  const nextHand = useCallback(() => {
    setSelected(new Set());
    setSheetRequested(false);
    if (state.phase === "gameOver") startNewGame();
    else dealNextHand();
  }, [dealNextHand, startNewGame, state.phase]);

  const mode: HandMode =
    state.phase === "passing"
      ? "pass"
      : state.phase === "playing" && state.turn === HUMAN && !isTrickComplete(state)
        ? "play"
        : "idle";
  const legalIds = useMemo(() => new Set(legalPlays(state, HUMAN).map((c) => c.id)), [state]);

  const onActivate = useCallback(
    (card: Card) => {
      if (state.phase === "passing") {
        const next = new Set(selected);
        if (next.has(card.id)) next.delete(card.id);
        else if (next.size >= PASS_COUNT) {
          setNotice({ text: t("status.tooMany"), state });
          return;
        } else next.add(card.id);
        setSelected(next);
        setNotice(null);
        return;
      }
      const reason = illegalReason(state, HUMAN, card);
      if (reason) {
        setNotice({ text: t(`status.illegal.${reason}`), state });
        return;
      }
      play(card.id);
    },
    [play, selected, state, t],
  );

  function confirmPass() {
    if (state.phase !== "passing") return;
    if (selected.size !== PASS_COUNT) {
      setNotice({ text: t("status.selectThree"), state });
      return;
    }
    pass([...selected]);
    setSelected(new Set());
  }

  function passName() {
    return names[passTarget(HUMAN, passDirection(state.handNumber))];
  }

  const lastResult = state.history[state.history.length - 1];
  const resultMessage = (() => {
    if (state.phase === "gameOver") {
      const best = winners(state.totals);
      const score = state.totals[best[0]];
      if (best.includes(HUMAN)) return t(best.length > 1 ? "status.youTie" : "status.youWin", { score });
      return t("status.otherWins", { name: best.map((s) => names[s]).join(" & "), score });
    }
    if (handOver && lastResult?.moon != null) {
      return lastResult.moon === HUMAN ? t("status.youShotMoon") : t("status.shotMoon", { name: names[lastResult.moon] });
    }
    return undefined;
  })();

  const message = (() => {
    if (notice && notice.state === state) return notice.text;
    switch (state.phase) {
      case "passing":
        return t(`status.${PASS_KEYS[passDirectionKey(state)]}`, { name: passName() });
      case "handOver":
      case "gameOver":
        return resultMessage ?? t("status.handOver");
      case "playing": {
        if (isTrickComplete(state)) {
          const winner = trickWinner(state.trick);
          return winner === HUMAN ? t("status.youTakeTrick") : t("status.takesTrick", { name: names[winner] });
        }
        if (state.turn !== HUMAN) return t("status.waiting", { name: names[state.turn] });
        if (state.trick.length > 0) return t("status.yourTurn");
        return state.tricksPlayed === 0 ? t("status.yourLeadTwoOfClubs") : t("status.yourLead");
      }
    }
  })();

  const gameMenu = useStandardGameMenu({
    game: "hearts",
    onNewGame: startNewGame,
    options: [{ id: "scores", label: t("menu.scores"), onSelect: () => setSheetRequested(true) }],
  });
  const common = useTranslations("apps.games.common");
  const menus: GameMenu[] = [
    gameMenu,
    {
      id: "help",
      label: common("help"),
      items: [{ id: "rules", label: t("menu.rules"), onSelect: () => setRulesOpen(true) }],
    },
  ];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "F2") {
      event.preventDefault();
      startNewGame();
    }
  }

  const sheetAction =
    state.phase === "gameOver" ? common("playAgain") : state.phase === "handOver" ? t("nextHand") : common("close");

  return (
    <GameShell
      game="hearts"
      menus={menus}
      onKeyDown={onKeyDown}
      bodyClassName="bg-felt-gradient"
      status={[
        <span key="msg" data-hearts-status className="truncate">
          {message}
        </span>,
        <span key="score" className="truncate">
          {t("scoreCell", { score: state.totals[HUMAN] })} · {t("handCell", { number: state.handNumber + 1 })}
        </span>,
      ]}
    >
      <div className="flex min-h-full flex-col items-center gap-2 p-2">
        <Opponent seat={2} name={names[2]} score={state.totals[2]} count={state.hands[2].length} active={isActive(state, 2)} />
        <div className="flex w-full flex-1 items-center justify-center gap-2 md:gap-6">
          <Opponent seat={1} name={names[1]} score={state.totals[1]} count={state.hands[1].length} active={isActive(state, 1)} />
          <TrickArea trick={state.trick} names={names} reducedMotion={reducedMotion} />
          <Opponent seat={3} name={names[3]} score={state.totals[3]} count={state.hands[3].length} active={isActive(state, 3)} />
        </div>
        <div className="flex min-h-push-button-h flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-system text-text-inverse">
          {state.phase === "passing" && (
            <Button
              data-hearts-action="pass"
              aria-disabled={selected.size !== PASS_COUNT || undefined}
              onClick={confirmPass}
              className="max-md:h-touch-target"
            >
              {t("passButton")} ({selected.size}/{PASS_COUNT})
            </Button>
          )}
          {handOver && !sheetOpen && (
            <Button variant="primary" data-hearts-action="next" onClick={nextHand} className="max-md:h-touch-target">
              {sheetAction}
            </Button>
          )}
          {!sheetOpen && (
            <span aria-hidden className="font-bold" data-hearts-message>
              {message}
            </span>
          )}
        </div>
        <PlayerHand cards={state.hands[HUMAN]} mode={mode} selected={selected} legalIds={legalIds} onActivate={onActivate} />
      </div>
      <ScoreSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (open) return;
          setSheetRequested(false);
          if (handOver) setSheetDismissed(state.handNumber);
        }}
        names={names}
        history={state.history}
        totals={state.totals}
        message={handOver ? resultMessage : undefined}
        actionLabel={sheetAction}
        onAction={() => {
          if (handOver) nextHand();
          else setSheetRequested(false);
        }}
      />
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </GameShell>
  );
}

function passDirectionKey(state: HeartsState): keyof typeof PASS_KEYS {
  const direction = passDirection(state.handNumber);
  return direction === "none" ? "left" : direction;
}

function isActive(state: HeartsState, seat: number): boolean {
  return state.phase === "playing" && !isTrickComplete(state) && state.turn === seat;
}
