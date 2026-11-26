"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { GameOverDialog, GameShell, useStandardGameMenu } from "@/components/apps/games/shared/GameShell";
import { MinesBoard } from "@/components/apps/games/mines/MinesBoard";
import { FlagIcon, MinesFace, type FaceState } from "@/components/apps/games/mines/MinesIcons";
import { useMinesGame } from "@/components/apps/games/mines/useMinesGame";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DIFFICULTY_IDS, minesLeft, type Difficulty } from "@/lib/games/mines/engine";
import { randomSeed } from "@/lib/games/rng";
import { cn } from "@/lib/utils";

const MAX_TIME = 999;

/** Three-digit LED readout ("010", "-05"), clamped to -99…999. */
function formatLed(value: number): string {
  const n = Math.max(-99, Math.min(MAX_TIME, Math.trunc(value)));
  return n < 0 ? `-${String(-n).padStart(2, "0")}` : String(n).padStart(3, "0");
}

/**
 * Cell size: fit the board's width when it can, within a comfortable range.
 * Touch keeps cells at 28px or more (the board scrolls past that).
 */
function cellSizeFor(cols: number, mobile: boolean): string {
  const fit = `calc((100cqw - 0.25rem) / ${cols})`;
  return mobile ? `clamp(28px, ${fit}, 40px)` : `clamp(18px, ${fit}, 28px)`;
}

function Led({ value, label, ...data }: { value: number; label: string } & Record<`data-${string}`, boolean>) {
  return (
    <span
      role="img"
      aria-label={label}
      {...data}
      className="bg-mines-display px-1 font-mono text-heading-lg leading-none tracking-wider text-mines-display-text shadow-bevel-sunken tabular-nums"
    >
      {formatLed(value)}
    </span>
  );
}

/** Mines (stage 12): the classic minefield as an original DouglasOS game. */
export default function MinesApp({ initialSeed }: { initialSeed?: number } = {}) {
  const t = useTranslations("games.mines");
  const tc = useTranslations("apps.games.common");
  const mobile = useIsMobile();
  const [{ difficulty, game }, dispatch] = useMinesGame(initialSeed);
  const [focus, setFocus] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [wonDismissed, setWonDismissed] = useState(false);

  // The timer starts at the first reveal and stops when the game ends.
  useEffect(() => {
    if (game.status !== "playing") return;
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.min(MAX_TIME, Math.floor((Date.now() - start) / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [game.status]);

  function startNew(next?: Difficulty) {
    dispatch({ type: "new", seed: randomSeed(), difficulty: next });
    setElapsed(0);
    setWonDismissed(false);
    setPressing(false);
    if (next && next !== difficulty) setFocus(0);
  }

  const gameMenu = useStandardGameMenu({
    game: "mines",
    onNewGame: () => startNew(),
    options: [
      ...DIFFICULTY_IDS.map((id) => ({
        id,
        label: t(`difficulty.${id}`),
        checked: id === difficulty,
        onSelect: () => startNew(id),
      })),
      "separator" as const,
      {
        id: "marks",
        label: t("marks"),
        checked: game.questionMarks,
        onSelect: () => dispatch({ type: "marks", on: !game.questionMarks }),
      },
    ],
  });

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "F2") {
      e.preventDefault();
      startNew();
    }
  }

  const face: FaceState =
    game.status === "won" ? "won" : game.status === "lost" ? "lost" : pressing ? "pressing" : "idle";
  const left = minesLeft(game);
  const statusText =
    game.status === "ready"
      ? t(mobile ? "status.readyTouch" : "status.ready")
      : game.status === "playing"
        ? t("status.playing", { count: left })
        : t(`status.${game.status}`);

  return (
    <GameShell
      game="mines"
      menus={[gameMenu]}
      onKeyDown={onKeyDown}
      bodyClassName="flex flex-col overflow-hidden"
      status={[statusText, t(`difficulty.${difficulty}`)]}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-3 pb-2">
        <Led value={left} label={t("counter", { count: left })} data-mines-counter />
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-mines-face={face}
            aria-label={t(`face.${face}`)}
            onClick={() => startNew()}
            className="flex size-9 items-center justify-center rounded-button bg-button-face shadow-bevel-raised focus-light active:shadow-bevel-pressed max-md:size-touch-target"
          >
            <MinesFace state={face} className="size-7 max-md:size-9" />
          </button>
          {mobile && (
            <button
              type="button"
              data-mines-flag-mode
              aria-pressed={flagMode}
              aria-label={t("flagMode")}
              onClick={() => setFlagMode((on) => !on)}
              className={cn(
                "flex size-touch-target items-center justify-center rounded-button bg-button-face focus-light",
                flagMode ? "bg-hot-light shadow-bevel-pressed" : "shadow-bevel-raised",
              )}
            >
              <FlagIcon className="size-6" />
            </button>
          )}
        </div>
        <Led value={elapsed} label={t("timer", { seconds: elapsed })} data-mines-timer />
      </div>
      <div className="@container min-h-0 flex-1 overflow-auto px-3 pb-3">
        <div className="flex min-w-fit justify-center">
          <MinesBoard
            game={game}
            dispatch={dispatch}
            focus={focus < game.cells.length ? focus : 0}
            onFocusChange={setFocus}
            flagMode={flagMode}
            onPressingChange={setPressing}
            cellSize={cellSizeFor(game.config.cols, mobile)}
          />
        </div>
      </div>
      <GameOverDialog
        open={game.status === "won" && !wonDismissed}
        onOpenChange={(open) => {
          if (!open) setWonDismissed(true);
        }}
        title={tc("won")}
        message={t("wonMessage", { difficulty: t(`difficulty.${difficulty}`), seconds: elapsed })}
        icon={<MinesFace state="won" className="size-8" />}
        onPlayAgain={() => startNew()}
      />
    </GameShell>
  );
}
