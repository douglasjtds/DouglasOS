"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { useAssistantStore } from "@/lib/store/assistantStore";
import { selectActiveBalloon, useBalloonStore } from "@/lib/store/balloonStore";
import { useShellStore } from "@/lib/store/shellStore";
import { useWindowStore } from "@/lib/store/windowStore";
import { matchIntent } from "@/lib/assistant/intents";
import { runShellAction } from "@/lib/assistant/actions";
import {
  ASSISTANT_TIMING,
  answerMessage,
  helpMessage,
  type AssistantAction,
} from "@/lib/assistant/script";
import {
  CHARACTER_SIZE_MOBILE,
  assistantClearance,
  bubbleRect,
  characterRect,
  tailOffset,
} from "@/lib/assistant/layout";
import type { Rect, Viewport } from "@/lib/store/geometry";
import { useAssistantTriggers } from "@/hooks/useAssistantTriggers";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { AssistantBubble } from "@/components/os/assistant/AssistantBubble";
import { AssistantCharacter } from "@/components/os/assistant/AssistantCharacter";

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function useViewport(): Viewport {
  const width = useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 0);
  const height = useSyncExternalStore(subscribeResize, () => window.innerHeight, () => 0);
  return { width, height };
}

/** Rect of the focused, visible window (null when the desktop is clear). */
function useFocusedWindowRect(): Rect | null {
  return useWindowStore(
    useShallow((s) => {
      const w = s.focusedId ? s.windows[s.focusedId] : undefined;
      return w && !w.minimized ? w.rect : null;
    }),
  );
}

/** Another transient (menu, dialog) owns Esc before the assistant does. */
function overlayOpen(): boolean {
  const { startMenuOpen, dialog } = useShellStore.getState();
  return (
    startMenuOpen ||
    dialog !== null ||
    document.querySelector('[role="menu"], [role="alertdialog"], [role="dialog"]') !== null
  );
}

function isTextField(el: Element | null): boolean {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement | null)?.isContentEditable === true;
}

/**
 * mini Douglas (DESKTOP-INTERFACE-SPEC §13): the scripted desktop companion.
 * Lazy-loaded after the critical UI (see `LazyAssistant`). Lives in its own
 * layer above windows and below the taskbar (z 1050), shares the single
 * balloon slot with the tray balloons, and steps aside whenever he'd cover
 * the focused window's title bar.
 *
 * Desktop: character on the taskbar toward the tray, balloon above him.
 * Phones: smaller character above the taskbar (hidden while a full-screen
 * window is up) and the bubble as a bottom sheet.
 */
export default function Assistant() {
  const t = useTranslations("assistant");
  const mobile = useIsMobile();
  const reduced = useReducedMotion();
  const phase = useShellStore((s) => s.phase);
  useAssistantTriggers(mobile);

  const { visible, dismissed, state, current } = useAssistantStore(
    useShallow((s) => ({ visible: s.visible, dismissed: s.dismissed, state: s.state, current: s.queue[0] ?? null })),
  );
  const activeBalloon = useBalloonStore(selectActiveBalloon);
  const vp = useViewport();
  const focusedRect = useFocusedWindowRect();
  const characterButton = useRef<HTMLButtonElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  const onScreen = visible && !dismissed && phase === "desktop";
  const otherBalloon = activeBalloon !== null && activeBalloon !== "assistant";
  const clearance = mobile
    ? { character: focusedRect === null, bubble: true }
    : assistantClearance(vp, focusedRect);
  const showCharacter = onScreen && !otherBalloon && clearance.character;
  const wantsBubble = onScreen && current !== null && state !== "dancing" && clearance.bubble;
  const showBubble = wantsBubble && activeBalloon === "assistant";

  // One balloon at a time: hold the shared slot only while there's a line to show.
  useEffect(() => {
    const { request, release } = useBalloonStore.getState();
    if (wantsBubble) request("assistant");
    else release("assistant");
  }, [wantsBubble]);
  useEffect(() => () => useBalloonStore.getState().release("assistant"), []);

  const closeMessage = useCallback(() => {
    const hadFocus = layer.current?.contains(document.activeElement) ?? false;
    useAssistantStore.getState().closeMessage();
    if (hadFocus) characterButton.current?.focus();
  }, []);

  // Esc closes the bubble first (topmost transient), before the window
  // manager's Esc-closes-window. Capture phase so it runs ahead of the shell.
  useEffect(() => {
    if (!showBubble) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.defaultPrevented || overlayOpen()) return;
      const inBubble = layer.current?.contains(document.activeElement) ?? false;
      if (!inBubble && isTextField(document.activeElement)) return;
      e.preventDefault();
      e.stopPropagation();
      closeMessage();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [showBubble, closeMessage]);

  function onCharacterClick() {
    const store = useAssistantStore.getState();
    if (store.state === "dancing") return;
    if (reduced) {
      store.replace(helpMessage());
      return;
    }
    if (store.queue.length > 0) store.closeMessage();
    store.dance({ durationMs: ASSISTANT_TIMING.clickDance });
  }

  function onAction(action: AssistantAction) {
    const store = useAssistantStore.getState();
    switch (action.kind) {
      case "nextTip":
        store.nextTip();
        return;
      case "dismiss": {
        const hadFocus = layer.current?.contains(document.activeElement) ?? false;
        store.dismiss();
        if (hadFocus) document.querySelector<HTMLElement>("[data-start-button]")?.focus();
        return;
      }
      default:
        // Opening the Explorer from here makes the "first time in Projects"
        // tip redundant.
        if (action.kind === "openProject" || (action.kind === "openApp" && action.app === "projects")) {
          store.markFired("projects");
        }
        store.closeMessage();
        runShellAction(action);
    }
  }

  function onSearch(query: string) {
    useAssistantStore.getState().replace(answerMessage(matchIntent(query)));
  }

  if (!onScreen) return null;

  const character = mobile ? null : characterRect(vp);
  const bubble = mobile ? null : bubbleRect(vp);

  return (
    <div
      ref={layer}
      data-assistant
      className="pointer-events-none absolute inset-0 z-1050"
    >
      {showCharacter && (
        <button
          ref={characterButton}
          type="button"
          aria-label={t("characterLabel")}
          data-assistant-character
          data-state={state}
          onClick={onCharacterClick}
          style={
            character
              ? { left: character.x, top: character.y, width: character.width, height: character.height }
              : { width: CHARACTER_SIZE_MOBILE.width, height: CHARACTER_SIZE_MOBILE.height }
          }
          className="pointer-events-auto absolute cursor-pointer rounded-balloon focus-light max-md:right-2 max-md:bottom-[calc(var(--spacing-taskbar)+8px)]"
        >
          <AssistantCharacter state={state} reducedMotion={reduced} />
        </button>
      )}
      {showBubble && current && (
        <AssistantBubble
          key={`${current.id}:${current.textKey}`}
          message={current}
          variant={mobile ? "sheet" : "balloon"}
          style={
            bubble
              ? { left: bubble.x, bottom: vp.height - (bubble.y + bubble.height), width: bubble.width, maxHeight: bubble.height }
              : undefined
          }
          tailX={bubble ? tailOffset(vp) : undefined}
          reducedMotion={reduced}
          onAction={onAction}
          onClose={closeMessage}
          onSearch={onSearch}
        />
      )}
    </div>
  );
}
