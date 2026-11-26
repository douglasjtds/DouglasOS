"use client";

import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTrashNoticeStore } from "@/lib/store/trashNoticeStore";
import { selectActiveBalloon, useBalloonStore } from "@/lib/store/balloonStore";
import { useShellStore } from "@/lib/store/shellStore";
import { runShellAction } from "@/lib/assistant/actions";
import type { AssistantAction } from "@/lib/assistant/script";
import { binBalloonPlacement } from "@/lib/store/recycleBin";
import { useDesktopStore } from "@/lib/store/desktopStore";
import { BUBBLE_SIZE } from "@/lib/assistant/layout";
import { AssistantBubble } from "@/components/os/assistant/AssistantBubble";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useViewport } from "@/hooks/useViewport";
import { isTextField } from "@/lib/shortcuts";

/**
 * The Recycle Bin's own balloon (stage 6): carries mini Douglas's rescue line
 * when he was dismissed this session ("Not now"), so the joke still lands
 * without bringing the character back (see `announceRescue`). Same XP
 * balloon as his bubble, minus the search field; takes the shared balloon
 * slot (owner `recycleBin`); desktop: anchored to the bin's current cell —
 * above it, or below it when there's no room above (the top-right default) —
 * shifted to stay on screen, tail pointing at it (`binBalloonPlacement`);
 * phones: bottom sheet. Polite live region, never takes focus, closes itself
 * after a while (auto line), × or Esc closes it. Lazy-loaded by the shell only
 * once a notice exists.
 */
export default function TrashNotice() {
  const { notice, seq } = useTrashNoticeStore(useShallow((s) => ({ notice: s.notice, seq: s.seq })));
  const close = useTrashNoticeStore((s) => s.close);
  const phase = useShellStore((s) => s.phase);
  const holdsSlot = useBalloonStore((s) => selectActiveBalloon(s) === "recycleBin");
  const mobile = useIsMobile();
  const reduced = useReducedMotion();
  const vp = useViewport();
  const binCell = useDesktopStore((s) => s.binCell);

  const wanted = notice !== null && phase === "desktop";
  const visible = wanted && holdsSlot;

  useEffect(() => {
    const { request, release } = useBalloonStore.getState();
    if (wanted) request("recycleBin");
    else release("recycleBin");
  }, [wanted]);
  useEffect(() => () => useBalloonStore.getState().release("recycleBin"), []);

  const onClose = useCallback(() => close(), [close]);

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (useShellStore.getState().dialog || document.querySelector('[role="menu"], [role="alertdialog"]')) return;
      if (isTextField(document.activeElement)) return;
      e.preventDefault();
      e.stopPropagation();
      close();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [visible, close]);

  if (!visible || !notice) return null;

  function onAction(action: AssistantAction) {
    if (action.kind === "nextTip" || action.kind === "dismiss") return;
    close();
    runShellAction(action);
  }

  let style;
  let tailX;
  let tailSide: "top" | "bottom" | undefined;
  if (!mobile) {
    const place = binBalloonPlacement(binCell, vp, BUBBLE_SIZE);
    style = {
      left: place.x,
      width: place.width,
      maxHeight: place.maxHeight,
      ...(place.side === "above" ? { bottom: place.offset } : { top: place.offset }),
    };
    tailX = place.tailX;
    tailSide = place.side === "above" ? "bottom" : "top";
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-1300">
      <AssistantBubble
        key={seq}
        source="recycleBin"
        message={notice}
        variant={mobile ? "sheet" : "balloon"}
        style={style}
        tailX={tailX}
        tailSide={tailSide}
        reducedMotion={reduced}
        onAction={onAction}
        onClose={onClose}
        onSearch={() => {}}
      />
    </div>
  );
}
