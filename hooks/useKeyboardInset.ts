import { useEffect, useState, type RefObject } from "react";

/**
 * How many pixels at the bottom of `ref`'s element the on-screen keyboard
 * covers (0 when there's no keyboard or no `visualViewport`). Phones shrink
 * the *visual* viewport when the keyboard opens while `100dvh` keeps the
 * layout height, so a chat composer pinned to the bottom of a full-screen
 * window would sit behind the keyboard; padding the element's bottom by this
 * inset keeps it in view (padding doesn't move the element's own bottom edge,
 * so there's no feedback loop). Only listens while `enabled` (touch shell).
 */
export function useKeyboardInset(enabled: boolean, ref: RefObject<HTMLElement | null>): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = typeof window === "undefined" ? undefined : window.visualViewport;
    if (!enabled || !viewport) return;
    const vv = viewport;
    function update() {
      const el = ref.current;
      if (!el) return;
      const covered = el.getBoundingClientRect().bottom - (vv.offsetTop + vv.height);
      // Ignore small differences (browser chrome settling, rounding).
      setInset(covered > 40 ? Math.round(covered) : 0);
    }
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [enabled, ref]);

  return enabled ? inset : 0;
}
