import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/** Whether the user prefers reduced motion (coerced to a plain boolean). */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}
