import { isAppId, type AppId, type LauncherId } from "@/lib/apps/registry";

/**
 * Home-page deep links (stage 10): `/{locale}#open=<app>` opens that window
 * once the shell mounts. Used by the real 404 page ("Talk to Douglas" →
 * `#open=contact`), which has no shell of its own. A hash, not a query
 * string, so the statically rendered home page stays the same document.
 */
export const OPEN_HASH_PREFIX = "#open=";

/** The window app a hash asks to open, or null for anything else. */
export function appFromHash(hash: string): AppId | null {
  if (!hash.startsWith(OPEN_HASH_PREFIX)) return null;
  let id: string;
  try {
    id = decodeURIComponent(hash.slice(OPEN_HASH_PREFIX.length)).trim();
  } catch {
    return null;
  }
  return id && isAppId(id as LauncherId) ? (id as AppId) : null;
}

/** `#open=<app>` for a window app. */
export function openHash(app: AppId): string {
  return `${OPEN_HASH_PREFIX}${app}`;
}
