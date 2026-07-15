/**
 * Canonical site origin for absolute URLs (metadata, OG, sitemap).
 * Override via NEXT_PUBLIC_SITE_URL once the final domain is decided.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://douglasos.vercel.app";
