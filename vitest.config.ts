import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest config for unit/integration tests (Testing Library + jsdom).
 *
 * E2E lives under `e2e/` and is run by Playwright, not Vitest — it's excluded
 * here. The `@` alias mirrors `tsconfig.json` (`@/*` -> repo root).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    // Keep Playwright specs and build/output dirs out of the Vitest run.
    exclude: ["e2e/**", "node_modules/**", ".next/**", ".claude/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**", "hooks/**", "components/**"],
      // Never scan build output or the agent worktrees (.claude/worktrees/*/.next
      // is full of generated files — see project memory).
      exclude: [
        "e2e/**",
        "node_modules/**",
        ".next/**",
        ".claude/**",
        "**/*.test.{ts,tsx}",
        "**/*.config.*",
      ],
    },
  },
});
