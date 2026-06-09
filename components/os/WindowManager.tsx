"use client";

import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/lib/store/windowStore";
import { Window } from "@/components/os/Window";

/**
 * Renders every open window. AnimatePresence keeps a closed window's node
 * mounted through its exit animation, so `closeWindow` removing it from the
 * store is the whole trigger — no separate "closing" state needed.
 */
export function WindowManager() {
  const order = useWindowStore((s) => s.order);

  return (
    <AnimatePresence>
      {order.map((id) => (
        <Window key={id} id={id} />
      ))}
    </AnimatePresence>
  );
}
