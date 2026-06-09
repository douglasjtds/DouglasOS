import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Loads `./i18n/request.ts` for per-request locale + messages (next-intl default path).
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray lockfile in the home
  // directory was causing Next to infer the wrong root for file tracing.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withNextIntl(nextConfig);
