import { useEffect } from "react";
import { useAssistantStore } from "@/lib/store/assistantStore";
import { useShellStore } from "@/lib/store/shellStore";
import { useWindowStore } from "@/lib/store/windowStore";
import {
  ASSISTANT_TIMING,
  greetingMessage,
  idleMessage,
  projectsTipMessage,
} from "@/lib/assistant/script";

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"] as const;

function onDesktop(): boolean {
  return useShellStore.getState().phase === "desktop";
}

/**
 * The assistant's automatic appearances (DESKTOP-INTERFACE-SPEC §13 →
 * Triggers), each once per session and never while a session screen is up:
 * 1. a while after logon — the greeting (or, if it already played this
 *    session, the character just shows up quietly);
 * 2. the first time DouglasOS Explorer opens — the address-bar tip;
 * 3. after a stretch without input — the CV + Contact nudge.
 * None of them moves focus; the bubble waits for the shared balloon slot.
 */
export function useAssistantTriggers(mobile: boolean) {
  const kind = mobile ? "mobile" : "desktop";
  const phase = useShellStore((s) => s.phase);

  // 1. Greeting after logon.
  useEffect(() => {
    if (phase !== "desktop") return;
    const timer = setTimeout(() => {
      if (!onDesktop()) return;
      const store = useAssistantStore.getState();
      if (!store.trigger("greeting", greetingMessage())) store.show();
    }, ASSISTANT_TIMING.greetingDelay[kind]);
    return () => clearTimeout(timer);
  }, [phase, kind]);

  // 2. First Explorer opening this session.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = useWindowStore.subscribe((state, prev) => {
      if (!state.windows.projects || prev.windows.projects) return;
      if (useAssistantStore.getState().fired.includes("projects")) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (onDesktop() && useWindowStore.getState().windows.projects) {
          useAssistantStore.getState().trigger("projects", projectsTipMessage());
        }
      }, ASSISTANT_TIMING.projectsDelay[kind]);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [kind]);

  // 3. Idle nudge.
  useEffect(() => {
    const { fired, dismissed } = useAssistantStore.getState();
    if (dismissed || fired.includes("idle")) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function stop() {
      if (timer) clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, restart, true);
    }
    function restart() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!onDesktop()) {
          restart();
          return;
        }
        useAssistantStore.getState().trigger("idle", idleMessage());
        stop();
      }, ASSISTANT_TIMING.idleDelay[kind]);
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, restart, { capture: true, passive: true });
    }
    restart();
    return stop;
  }, [kind]);
}
