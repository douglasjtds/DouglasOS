import { useState } from "react";
import { useDesktopStore } from "@/lib/store/desktopStore";
import type { DesktopIconId } from "@/lib/apps/registry";

/**
 * Where an icon is in the Recycle Bin rescue animation (stage 6):
 * "entering" (shrinking into the bin) → "returning" (fading back in on its
 * own cell) → "idle". Derived from `desktopStore.rescue.seq` during render,
 * so the very render that ends a drag already targets the bin (no frame of
 * springing home first). Under reduced motion it stays "idle": the icon is
 * simply back where it was.
 */
export type RescuePhase = "idle" | "entering" | "returning";

export function useRescuePhase(id: DesktopIconId, reducedMotion: boolean) {
  const seq = useDesktopStore((s) => (s.rescue?.ids.includes(id) ? s.rescue.seq : 0));
  // A rescue that happened before this icon mounted never replays.
  const [doneSeq, setDoneSeq] = useState(seq);
  const [returningSeq, setReturningSeq] = useState(0);

  const pending = seq !== 0 && seq !== doneSeq;
  // Reduced motion: settle immediately (adjusting state during render).
  if (pending && reducedMotion) setDoneSeq(seq);

  const phase: RescuePhase =
    pending && !reducedMotion ? (returningSeq === seq ? "returning" : "entering") : "idle";

  function onAnimationComplete() {
    if (phase === "entering") setReturningSeq(seq);
    else if (phase === "returning") setDoneSeq(seq);
  }

  return { phase, onAnimationComplete };
}
