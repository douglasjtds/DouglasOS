"use client";

import { useEffect } from "react";
import { useEasterEggStore } from "@/lib/store/easterEggStore";

/**
 * Counts a visit to the real 404 page as an easter egg (stage 11, `real-404`).
 * The page has no shell, so there is no toast here: `discover()` queues the
 * announcement in the persisted `pending` list and the desktop shows it the
 * next time it loads ("Back to desktop" / "Talk to Douglas").
 */
export function RealNotFoundDiscovery() {
  useEffect(() => {
    useEasterEggStore.getState().discover("real-404");
  }, []);
  return null;
}
