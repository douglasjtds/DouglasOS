"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AlertDialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { InfoIcon } from "@/components/icons/SystemIcons";
import { PinballIcon } from "@/components/icons/GameIcons";
import { MessageBox } from "@/components/os/MessageBox";
import { Button } from "@/components/ui/button";
import { GameOverDialog, GameShell, useStandardGameMenu, type GameMenu } from "@/components/apps/games/shared/GameShell";
import { controlForKey, sideForPointer } from "@/components/apps/games/pinball/controls";
import { createPainter, readPinballColors } from "@/components/apps/games/pinball/painter";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  advance,
  BALLS_PER_GAME,
  createInitialState,
  isBallInLane,
  type PinballInput,
  type PinballStatus,
} from "@/lib/games/pinball/engine";
import { TABLE_HEIGHT, TABLE_WIDTH } from "@/lib/games/pinball/table";
import { useWindowStore } from "@/lib/store/windowStore";

/** How often the polite status bar may pick up a new score (ms). */
const SCORE_ANNOUNCE_INTERVAL = 3000;

interface Hud {
  score: number;
  ball: number;
  status: PinballStatus;
  inLane: boolean;
}

const INITIAL_HUD: Hud = { score: 0, ball: 1, status: "playing", inLane: true };

function isWindowActive(): boolean {
  const { focusedId, windows } = useWindowStore.getState();
  return focusedId === "pinball" && !windows.pinball?.minimized;
}

/**
 * Pinball (stage 12): the "Night Shift" table on a canvas. The physics live
 * in `lib/games/pinball` (fixed timestep); this component owns the input,
 * the requestAnimationFrame loop (only while running), the DOM score panel
 * and the polite announcements. The loop pauses whenever the window loses
 * focus, is minimized or the tab is hidden.
 */
export default function PinballApp() {
  const t = useTranslations("games.pinball");
  const tc = useTranslations("apps.games.common");
  const reduced = useReducedMotion();

  const stateRef = useRef(createInitialState());
  const inputRef = useRef<PinballInput>({ left: false, right: false, plunger: false });
  const keysRef = useRef(new Set<string>());
  const pointersRef = useRef(new Map<number, "left" | "right">());
  const launchHeldRef = useRef(false);
  const seenRef = useRef({ drains: 0, saves: 0, banks: 0 });
  const hudRef = useRef<Hud>(INITIAL_HUD);
  const bestRef = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const drawRef = useRef<ReturnType<typeof createPainter> | null>(null);

  const [hud, setHud] = useState<Hud>(INITIAL_HUD);
  const [best, setBest] = useState(0);
  const [statusScore, setStatusScore] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [held, setHeld] = useState<PinballInput>({ left: false, right: false, plunger: false });
  const [paused, setPaused] = useState(() => !isWindowActive());
  const [hidden, setHidden] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [gameOverOpen, setGameOverOpen] = useState(false);
  const [newHigh, setNewHigh] = useState(false);
  const active = useWindowStore((s) => s.focusedId === "pinball" && !s.windows.pinball?.minimized);

  const running = active && !hidden && !paused && !helpOpen && !gameOverOpen && hud.status === "playing";

  // --- drawing --------------------------------------------------------------

  const drawNow = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (!drawRef.current) drawRef.current = createPainter(ctx, readPinballColors(canvas));
    const k = scaleRef.current;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawRef.current(stateRef.current, reduced);
  }, [reduced]);

  // Fit the fixed logical table into the play area (letterboxed, DPR-aware).
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!stage || !canvas || !frame) return;
    const fit = () => {
      const fitScale = Math.min(stage.clientWidth / TABLE_WIDTH, stage.clientHeight / TABLE_HEIGHT);
      const scale = fitScale > 0 ? fitScale : 1;
      const dpr = window.devicePixelRatio || 1;
      const cssW = Math.floor(TABLE_WIDTH * scale);
      const cssH = Math.floor(TABLE_HEIGHT * scale);
      frame.style.width = `${cssW}px`;
      frame.style.height = `${cssH}px`;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      scaleRef.current = (cssW * dpr) / TABLE_WIDTH;
      drawNow();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [drawNow]);

  // --- HUD sync + announcements -------------------------------------------

  const syncHud = useCallback(() => {
    const s = stateRef.current;
    const inLane = isBallInLane(s);
    const prev = hudRef.current;
    const seen = seenRef.current;
    if (s.drains !== seen.drains || s.saves !== seen.saves || s.banks !== seen.banks) {
      if (s.status === "over") {
        setAnnouncement(t("announce.gameOver", { score: s.score }));
      } else if (s.drains !== seen.drains) {
        setAnnouncement(t("announce.ballLost", { ball: s.ballNumber, total: BALLS_PER_GAME }));
      } else if (s.saves !== seen.saves) {
        setAnnouncement(t("announce.ballSaved"));
      } else {
        setAnnouncement(t("announce.bank"));
      }
      if (s.drains !== seen.drains) setStatusScore(s.score);
      seenRef.current = { drains: s.drains, saves: s.saves, banks: s.banks };
    }
    if (s.score !== prev.score || s.ballNumber !== prev.ball || s.status !== prev.status || inLane !== prev.inLane) {
      const next: Hud = { score: s.score, ball: s.ballNumber, status: s.status, inLane };
      hudRef.current = next;
      setHud(next);
      if (s.status === "over" && prev.status === "playing") {
        setNewHigh(s.score > bestRef.current && s.score > 0);
        bestRef.current = Math.max(bestRef.current, s.score);
        setBest(bestRef.current);
        setStatusScore(s.score);
        setGameOverOpen(true);
      }
    }
  }, [t]);

  // --- input ----------------------------------------------------------------

  const syncInput = useCallback(() => {
    let left = false;
    let right = false;
    let plunger = launchHeldRef.current;
    for (const side of pointersRef.current.values()) {
      if (side === "left") left = true;
      else right = true;
    }
    // Several keys can drive one control (Z + Left Shift): any held one counts.
    for (const code of keysRef.current) {
      const control = controlForKey(code);
      if (control === "left") left = true;
      else if (control === "right") right = true;
      else if (control === "plunger") plunger = true;
    }
    const input = inputRef.current;
    input.left = left;
    input.right = right;
    input.plunger = plunger;
    setHeld((h) =>
      h.left === input.left && h.right === input.right && h.plunger === input.plunger ? h : { ...input },
    );
  }, []);

  const releaseAll = useCallback(() => {
    keysRef.current.clear();
    pointersRef.current.clear();
    launchHeldRef.current = false;
    syncInput();
  }, [syncInput]);

  const focusCanvas = useCallback(() => {
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  const newGame = useCallback(() => {
    stateRef.current = createInitialState();
    seenRef.current = { drains: 0, saves: 0, banks: 0 };
    hudRef.current = INITIAL_HUD;
    setHud(INITIAL_HUD);
    setStatusScore(0);
    setAnnouncement("");
    setGameOverOpen(false);
    setNewHigh(false);
    setPaused(false);
    releaseAll();
    drawNow();
    focusCanvas();
  }, [drawNow, focusCanvas, releaseAll]);

  const togglePause = useCallback(() => {
    releaseAll();
    setPaused((p) => !p);
  }, [releaseAll]);

  const resume = useCallback(() => {
    setPaused(false);
    focusCanvas();
  }, [focusCanvas]);

  // Keys are handled around the whole shell so they keep working after a
  // menu closes (focus returns to the menu bar). Menus and dialogs keep theirs.
  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('[role="menu"], [role="dialog"], [role="alertdialog"]')) return;
      // Leave modified keys to the shell (Alt+Shift+Arrow maximize/restore…).
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const control = controlForKey(e.code);
      if (!control) return;
      const onMenuBar = target.closest('[role="menubar"]') !== null;
      if (control === "newGame") {
        e.preventDefault();
        newGame();
        return;
      }
      if (onMenuBar && (e.code === "Space" || e.code === "ArrowDown" || e.code === "Escape")) return;
      if (control === "pause") {
        // Only swallow P/Esc when it pauses; otherwise Esc reaches the shell's close prompt.
        if (hudRef.current.status !== "playing") return;
        e.preventDefault();
        if (!e.repeat) togglePause();
        return;
      }
      e.preventDefault();
      if (e.repeat) return;
      keysRef.current.add(e.code);
      syncInput();
    },
    [newGame, syncInput, togglePause],
  );

  const onKeyUp = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (keysRef.current.delete(e.code)) syncInput();
    },
    [syncInput],
  );

  const onCanvasPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      focusCanvas();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      pointersRef.current.set(e.pointerId, sideForPointer(e.clientX, e.currentTarget.getBoundingClientRect()));
      syncInput();
    },
    [focusCanvas, syncInput],
  );

  const onCanvasPointerEnd = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (pointersRef.current.delete(e.pointerId)) syncInput();
    },
    [syncInput],
  );

  const setLaunchHeld = useCallback(
    (value: boolean) => {
      if (launchHeldRef.current === value) return;
      launchHeldRef.current = value;
      syncInput();
    },
    [syncInput],
  );

  // --- pausing --------------------------------------------------------------

  useEffect(() => {
    const unsubscribe = useWindowStore.subscribe(() => {
      if (!isWindowActive()) {
        setPaused(true);
        releaseAll();
      }
    });
    const onVisibility = () => {
      const isHidden = document.visibilityState === "hidden";
      setHidden(isHidden);
      if (isHidden) {
        setPaused(true);
        releaseAll();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", releaseAll);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", releaseAll);
    };
  }, [releaseAll]);

  // --- loop -----------------------------------------------------------------

  useEffect(() => {
    if (!running) {
      drawNow();
      return;
    }
    let raf = 0;
    let last: number | null = null;
    const frame = (now: number) => {
      const elapsed = last === null ? 0 : (now - last) / 1000;
      last = now;
      advance(stateRef.current, inputRef.current, elapsed);
      drawNow();
      syncHud();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, drawNow, syncHud]);

  // The polite status bar picks up the score at most every few seconds.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setStatusScore(stateRef.current.score), SCORE_ANNOUNCE_INTERVAL);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    focusCanvas();
  }, [focusCanvas]);

  // --- menus ----------------------------------------------------------------

  const gameMenu = useStandardGameMenu({
    game: "pinball",
    onNewGame: newGame,
    options: [
      {
        id: "pause",
        label: paused ? t("resume") : t("pause"),
        onSelect: togglePause,
        disabled: hud.status !== "playing",
        shortcut: "P",
      },
    ],
  });
  const helpMenu: GameMenu = {
    id: "help",
    label: tc("help"),
    items: [{ id: "controls", label: t("controls"), onSelect: () => setHelpOpen(true) }],
  };

  const high = Math.max(best, hud.score);
  const showPaused = paused && hud.status === "playing" && !gameOverOpen;
  const showLaunch = hud.inLane && hud.status === "playing" && !showPaused;

  return (
    <div className="h-full" onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
      <GameShell
        game="pinball"
        menus={[gameMenu, helpMenu]}
        bodyClassName="bg-pinball-table overflow-hidden"
        status={[
          tc("score", { score: statusScore }),
          t("statusBall", { ball: hud.ball, total: BALLS_PER_GAME }),
          t("statusHigh", { score: Math.max(best, statusScore) }),
        ]}
      >
        <div
          data-pinball
          data-paused={showPaused ? "true" : "false"}
          data-left-flipper={held.left ? "down" : "up"}
          data-right-flipper={held.right ? "down" : "up"}
          data-plunger={held.plunger ? "down" : "up"}
          className="flex h-full min-h-0 flex-col text-pinball-text"
        >
          <dl
            data-pinball-panel
            className="grid shrink-0 grid-cols-3 gap-1 border-b border-pinball-table-glow px-2 py-1 font-mono text-system"
          >
            <div className="flex flex-col items-center">
              <dt className="uppercase">{t("score")}</dt>
              <dd data-pinball-score className="text-heading tabular-nums text-pinball-flipper">
                {hud.score}
              </dd>
            </div>
            <div className="flex flex-col items-center">
              <dt className="uppercase">{t("ball")}</dt>
              <dd data-pinball-ball className="text-heading tabular-nums">
                {t("ballOf", { ball: hud.ball, total: BALLS_PER_GAME })}
              </dd>
            </div>
            <div className="flex flex-col items-center">
              <dt className="uppercase">{t("highScore")}</dt>
              <dd data-pinball-high className="text-heading tabular-nums">
                {high}
              </dd>
            </div>
          </dl>
          <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center justify-center p-1">
            <div ref={frameRef} className="relative">
              <canvas
                ref={canvasRef}
                data-pinball-canvas
                role="application"
                tabIndex={0}
                aria-label={t("tableLabel")}
                aria-describedby="pinball-description"
                className="block size-full touch-none select-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pinball-wall"
                onPointerDown={onCanvasPointerDown}
                onPointerUp={onCanvasPointerEnd}
                onPointerCancel={onCanvasPointerEnd}
                onLostPointerCapture={onCanvasPointerEnd}
                onContextMenu={(e) => e.preventDefault()}
              />
              <p id="pinball-description" className="sr-only">
                {t("tableDescription")}
              </p>
              {showLaunch && (
                <Button
                  type="button"
                  data-pinball-launch
                  aria-describedby="pinball-launch-hint"
                  aria-pressed={held.plunger}
                  className="absolute bottom-2 left-1 min-h-touch-target min-w-touch-target touch-none select-none px-3"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    setLaunchHeld(true);
                  }}
                  onPointerUp={() => setLaunchHeld(false)}
                  onPointerCancel={() => setLaunchHeld(false)}
                  onLostPointerCapture={() => setLaunchHeld(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!e.repeat) setLaunchHeld(true);
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.key === "Enter") setLaunchHeld(false);
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {t("launch")}
                  <span id="pinball-launch-hint" className="sr-only">
                    {t("launchHint")}
                  </span>
                </Button>
              )}
              {showPaused && (
                <button
                  type="button"
                  data-pinball-paused
                  onClick={resume}
                  className="absolute inset-0 flex items-center justify-center bg-pinball-table/80 p-4 text-center font-title text-heading text-pinball-text focus-inverse"
                >
                  {t("paused")}
                </button>
              )}
            </div>
          </div>
          <p aria-live="polite" className="sr-only" data-pinball-announcement>
            {announcement}
          </p>
        </div>
      </GameShell>

      <MessageBox
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title={t("controlsTitle")}
        icon={<InfoIcon size={32} />}
        testId="pinball-controls"
        actions={
          <AlertDialog.Cancel asChild>
            <Button variant="primary" data-game-action="close">
              {tc("close")}
            </Button>
          </AlertDialog.Cancel>
        }
      >
        <p className="mb-2">{t("controlsIntro")}</p>
        <ul className="mb-2 list-disc pl-5">
          <li>{t("controlsList.left")}</li>
          <li>{t("controlsList.right")}</li>
          <li>{t("controlsList.plunger")}</li>
          <li>{t("controlsList.pause")}</li>
          <li>{t("controlsList.newGame")}</li>
          <li>{t("controlsList.touch")}</li>
        </ul>
        <p>{t("scoring")}</p>
      </MessageBox>

      <GameOverDialog
        open={gameOverOpen}
        onOpenChange={setGameOverOpen}
        title={tc("lost")}
        icon={<PinballIcon size={32} />}
        message={
          <>
            <p>{t("gameOverMessage", { score: hud.score })}</p>
            {newHigh && <p className="font-bold">{t("newHighScore")}</p>}
          </>
        }
        onPlayAgain={newGame}
      />
    </div>
  );
}
