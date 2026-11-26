"use client";

import { lazy, Suspense } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDontOpenThisStore } from "@/lib/store/dontOpenThisStore";

const EasterEggPlayer = lazy(() => import("@/components/os/easter-egg/EasterEggPlayer"));

/**
 * Mount point of "DON'T OPEN THIS.exe" (stage 10). The eggs' code loads only
 * when one is opened, so the shell bundle doesn't carry it. `seq` remounts the
 * player on every open, so each egg starts from its first frame.
 */
export function LazyEasterEgg() {
  const { active, seq } = useDontOpenThisStore(useShallow((s) => ({ active: s.active, seq: s.seq })));
  if (!active) return null;
  return (
    <Suspense fallback={null}>
      <EasterEggPlayer key={seq} egg={active} />
    </Suspense>
  );
}
