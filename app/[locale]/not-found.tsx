import { NotFoundPage } from "@/components/os/easter-egg/NotFoundPage";

/**
 * Localized 404 (stage 10): rendered inside `[locale]/layout.tsx`, so it has
 * the right `<html lang>` and EN/PT messages. Reached through `notFound()`,
 * which `[...rest]/page.tsx` throws for every unknown path under a locale
 * (`/en/whatever`, `/pt/qualquer`); the proxy already prefixes unprefixed
 * paths with `/en`. Next answers 404 and adds `noindex` by itself.
 */
export default function NotFound() {
  return <NotFoundPage />;
}
