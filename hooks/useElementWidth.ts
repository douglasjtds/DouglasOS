import { useEffect, useState, type RefObject } from "react";

/**
 * Live content-box width of an element (ResizeObserver), or `fallback` until
 * it has been measured. Used by the mobile icon grid, whose container width
 * already excludes the safe-area insets.
 */
export function useElementWidth(
  ref: RefObject<HTMLElement | null>,
  fallback: number,
): number {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return width ?? fallback;
}
