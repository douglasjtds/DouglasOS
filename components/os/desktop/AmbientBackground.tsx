"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// The whole three.js bundle stays out of the shell chunk and only loads
// client-side, after the desktop is interactive.
const AmbientScene = dynamic(
  () => import("@/components/os/desktop/AmbientScene"),
  { ssr: false },
);

/**
 * @react-three/fiber@9.6.1 still instantiates `new THREE.Clock()` internally
 * for every Canvas (react-three-fiber#3717); three.js has deprecated Clock
 * in favor of Timer, so it logs a warning on every mount. Fiber has no
 * stable release without this yet — filter only this exact upstream string,
 * once, at module init (before Canvas can ever mount), so real warnings
 * still surface.
 */
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("THREE.Clock: This module has been deprecated")
    ) {
      return;
    }
    originalWarn(...args);
  };
}

/**
 * Defers the ambient 3D scene until the browser is idle so it never competes
 * with critical UI (boot screen, icons, dock). Skipped entirely under
 * prefers-reduced-motion; mobile never mounts the desktop shell at all.
 */
export function AmbientBackground() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => setReady(true), { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (reduced || !ready) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <AmbientScene />
    </div>
  );
}
