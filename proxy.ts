import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Next.js 16 renamed Middleware to Proxy (the file convention is now `proxy.ts`).
// next-intl's request handler is filename-agnostic, so we mount it here as the
// proxy entrypoint to handle locale negotiation and `/` -> `/en` redirects.
export default createMiddleware(routing);

export const config = {
  // Run on every path except API routes, Next internals, and files with an
  // extension (static assets). Keeps the proxy off everything non-page.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
