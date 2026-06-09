import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True only after the first client-side mount — for SSR-unsafe reads.
 * Uses `useSyncExternalStore` so it's false during SSR/hydration, then true,
 * without a setState-in-effect.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
