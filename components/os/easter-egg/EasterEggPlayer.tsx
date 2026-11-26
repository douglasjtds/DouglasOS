"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEasterEggStore } from "@/lib/store/easterEggStore";
import { useAssistantStore } from "@/lib/store/assistantStore";
import { runShellAction, type ShellAction } from "@/lib/assistant/actions";
import { easterEggMessage } from "@/lib/assistant/easterEgg";
import type { EasterEggId } from "@/lib/easterEgg";
import { NotFoundEgg } from "@/components/os/easter-egg/NotFoundEgg";
import { ScrambleEgg } from "@/components/os/easter-egg/ScrambleEgg";
import { AccessDeniedEgg } from "@/components/os/easter-egg/AccessDeniedEgg";

/** What every egg gets from the player. */
export interface EggProps {
  /** Leave the egg: Esc, a click outside its buttons, its own close/OK. */
  dismiss: () => void;
  /** Run a CV / Contact shortcut and leave (no assistant comment after that). */
  act: (action: ShellAction) => void;
}

/**
 * Plays one egg and owns the rules all three share (DESKTOP-INTERFACE-SPEC →
 * "DON'T OPEN THIS.exe"): Esc or a click anywhere outside the egg's own
 * buttons (`data-egg-keep`) leaves at once; focus goes back where it was;
 * after a plain dismissal mini Douglas comments with CV / Contact shortcuts
 * through `say()` — a no-op after "Not now", so the egg never brings him back.
 */
export default function EasterEggPlayer({ egg }: { egg: EasterEggId }) {
  const close = useEasterEggStore((s) => s.close);
  const returnFocus = useRef<HTMLElement | null>(null);
  const done = useRef(false);

  const finish = useCallback(
    (comment: boolean) => {
      if (done.current) return;
      done.current = true;
      close();
      if (comment) useAssistantStore.getState().say(easterEggMessage(egg));
    },
    [close, egg],
  );
  const dismiss = useCallback(() => finish(true), [finish]);
  const act = useCallback(
    (action: ShellAction) => {
      finish(false);
      runShellAction(action);
    },
    [finish],
  );

  useEffect(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Capture phase on window: the window manager never sees this Esc.
      e.preventDefault();
      e.stopPropagation();
      dismiss();
    }
    function onPointerDown(e: PointerEvent) {
      if (e.target instanceof Element && e.target.closest("[data-egg-keep]")) return;
      dismiss();
    }
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
      const target = returnFocus.current;
      // Give focus back unless the visitor already moved it somewhere useful.
      if (target?.isConnected && (document.activeElement === document.body || !document.activeElement)) {
        target.focus({ preventScroll: true });
      }
    };
  }, [dismiss]);

  const props: EggProps = { dismiss, act };
  if (egg === "not-found") return <NotFoundEgg {...props} />;
  if (egg === "scramble") return <ScrambleEgg {...props} />;
  return <AccessDeniedEgg {...props} />;
}
