import { notFound } from "next/navigation";

/**
 * Catch-all for unknown paths under a locale (stage 10): without it an
 * unmatched URL would skip `[locale]/not-found.tsx` and get Next's generic,
 * unlocalized 404. Throwing `notFound()` here renders the localized DouglasOS
 * blue screen with a 404 status.
 */
export default function CatchAll() {
  notFound();
}
