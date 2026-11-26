"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useShellStore } from "@/lib/store/shellStore";
import { useAssistantStore } from "@/lib/store/assistantStore";

// The assistant (character art, bubble, intent matcher) stays out of the
// shell chunk and only loads client-side, after the desktop is interactive.
const Assistant = dynamic(() => import("@/components/os/assistant/Assistant"), { ssr: false });

/**
 * Mounts mini Douglas once the desktop is up and the browser is idle, so he
 * never competes with critical UI (icons, taskbar, first window). Not loaded
 * at all once he was dismissed this session ("Not now").
 */
export function LazyAssistant() {
  const phase = useShellStore((s) => s.phase);
  const dismissed = useAssistantStore((s) => s.dismissed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready || phase !== "desktop" || dismissed) return;
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setReady(true), 1000);
    return () => clearTimeout(timer);
  }, [ready, phase, dismissed]);

  if (!ready || dismissed) return null;
  return <Assistant />;
}
