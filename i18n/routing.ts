import { defineRouting } from "next-intl/routing";

// Single source of truth for locale routing. EN is the default; PT is the
// secondary locale reachable via an explicit `/pt` URL or the menu-bar toggle.
export const routing = defineRouting({
  locales: ["en", "pt"],
  defaultLocale: "en",
  // Every route carries its locale prefix (`/en/...`, `/pt/...`).
  localePrefix: "always",
  // EN-first: the unprefixed root (`/`) always redirects to the default locale.
  // Disabling detection skips the `accept-language` header and the locale cookie,
  // so a fresh visit never lands on PT by accident — PT is opt-in via URL/toggle.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
