"use client";

import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTrashNoticeStore } from "@/lib/store/trashNoticeStore";
import { selectActiveBalloon, useBalloonStore } from "@/lib/store/balloonStore";
import { useShellStore } from "@/lib/store/shellStore";
import { runShellAction } from "@/lib/assistant/actions";
import type { AssistantAction } from "@/lib/assistant/script";
import { binCell, iconRect } from "@/lib/store/recycleBin";
import { BUBBLE_SIZE } from "@/lib/assistant/layout";
import { AssistantBubble } from "@/components/os/assistant/AssistantBubble";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useViewport } from "@/hooks/useViewport";
import { isTextField } from "@/lib/shortcuts";

const EDGE_GAP = 8;
const BIN_GAP = 10;

/**
 * The Recycle Bin's own balloon (stage 6): carries mini Douglas's rescue line
 * when he was dismissed this session ("Not now"), so the joke still lands
 * without bringing the character back (see `announceRescue`). Same XP
 * balloon as his bubble, minus the search field; takes the shared balloon
 * slot (owner `recycleBin`); desktop: above the bin, tail pointing at it;
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
  if (!mobile) {
    const bin = iconRect(binCell(vp), vp);
    const width = Math.min(BUBBLE_SIZE.width, vp.width - 2 * EDGE_GAP);
    const x = vp.width - EDGE_GAP - width;
    style = { left: x, bottom: vp.height - (bin.y - BIN_GAP), width, maxHeight: BUBBLE_SIZE.maxHeight };
    tailX = Math.min(Math.max(bin.x + bin.width / 2 - x, 16), width - 16);
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
        reducedMotion={reduced}
        onAction={onAction}
        onClose={onClose}
        onSearch={() => {}}
      />
    </div>
  );
}
