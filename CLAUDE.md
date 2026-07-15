# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Before You Start

- **Read the docs in `/instructions` before making any change.** They are the source of truth for product decisions, scope, interface structure, and the visual design system. Key files:
  - `BRIEF.md` / `PRD.md` — the why and the product positioning.
  - `MVP-SCOPE.md` — what's IN vs OUT of v1. Re-read before adding anything; scope creep is the #1 risk.
  - `DESKTOP-INTERFACE-SPEC.md` — structure and behavior of every interface element (boot, menu bar, dock, windows, each app).
  - `DESIGN-GUIDELINES.md` — the design-token source of truth (colors, type, spacing, glass, motion). Implement tokens as Tailwind config + CSS variables; never hardcode values that have a token.
- **This is NOT the Next.js you may know.** Per `AGENTS.md`, this Next.js version has breaking changes vs. training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework code, and heed deprecation notices.

## Commands

```bash
npm run dev          # Next dev server (Turbopack) at http://localhost:3000
npm run build        # Production build
npm run start        # Serve the production build
npm run lint         # ESLint (flat config: eslint.config.mjs)
npm run test         # Vitest unit/integration tests (jsdom) — run once
npm run test:watch   # Vitest in watch mode
npm run test:coverage # Vitest with a v8 coverage report (text + html in coverage/)
npm run test:e2e     # Playwright e2e across Chromium/Firefox/WebKit
```

**Testing.** Two layers, both wired into CI (`.github/workflows/ci.yml`):

- **Unit/integration — Vitest + Testing Library** (`jsdom`). Config in `vitest.config.ts`, shared setup in `test/setup.ts` (installs an in-memory `localStorage` for the persisted Zustand store and pins a deterministic viewport). Tests are co-located as `*.test.ts(x)`. The high-value targets are the pure logic in `lib/store/` (`geometry.ts`, `desktopGrid.ts`) and the Zustand stores (`windowStore.ts`, `desktopStore.ts`) — keep those well covered. Coverage is reported, not gated.
- **E2E — Playwright** (`e2e/`, config `playwright.config.ts`). Drives the boot → desktop-shell flows that change least. Prefer resilient selectors (roles, `data-*`) over app copy, which is still evolving. Run `npx playwright install` once before the first local run.

## Tech Stack

The stack is **fixed**. Do not introduce alternatives (state, animation, i18n, CMS, ORM, etc.) without asking first. `MVP-SCOPE.md` lists explicitly-banned additions.

**Currently installed (base scaffold):**

- Next.js **16.2.7** (App Router) — note: *not* 14, despite what older notes may say.
- React 19, TypeScript 5, Tailwind CSS **v4** (via `@tailwindcss/postcss`), ESLint 9 (flat config).

**Target stack, to be added as features land (per `/instructions`):**

- shadcn/ui (in-window UI, dark-customized) · Framer Motion (all animation) · React Three Fiber + Drei (3D ambient background) · Zustand (window-manager state) · next-intl (EN/PT i18n, EN default) · lucide-react (icons).

When you install one of these, follow the conventions in the design + interface specs rather than the library defaults.

## Architecture (big picture)

DouglasOS is a personal portfolio rendered as a fictional desktop operating system. The "interface is the experience" — there is no traditional landing page. Understanding it requires reading the interface + design specs together; the high-level shape:

- **Boot → Desktop shell.** A boot screen (plays once per session via `sessionStorage`) fades into the desktop. The shell is a persistent **menu bar** (top: brand, active-app name, EN/PT toggle, clock), a **dock** (bottom: all apps), and free-placed **desktop icons**.
- **Window manager is the core.** Apps open as draggable, focusable, minimizable, maximizable windows with custom chrome. Window state (open set, focus, z-index, positions) lives in **Zustand** — this is the central piece of client state; most interactivity flows through it.
- **7 apps** surface portfolio content: `about`, `experience`, `projects`, `skills`, `how-i-work-with-ai`, `contact`, plus `resume.pdf` which is a **download action, not a window** (file at `public/resume.pdf`). `how-i-work-with-ai` is the marquee/AI-positioning section. Content is **static** (TS/MDX in-repo) — no backend, CMS, or database, ever, for this project.
- **3D background** (R3F + Drei) is ambient only: lazy-loaded after critical UI, capped/low-density, and **disabled on mobile and under `prefers-reduced-motion`**.
- **i18n** is EN-first with a PT toggle (next-intl), locale in the URL (`/en`, `/pt`) and persisted in `localStorage`.
- **Mobile (< 768px) drops the metaphor entirely** for a clean linear-scroll page using the same content and design tokens — it's an intentional alternate experience, not a degraded one.

Accessibility and `prefers-reduced-motion` are first-class throughout (see the accessibility + reduced-motion sections of the design/interface specs).

**Golden rule for any feature decision:** "Can a recruiter download the CV and reach contact in under 60 seconds without this?" If yes, it likely belongs in v1.5/v2, not the MVP.

## Conventions

- **Stay within the App Router structure** (`app/`, `components/`, `lib/`, `public/`, etc.). Do not create new top-level folders without asking first.
- **Import alias:** `@/*` maps to the repo root (see `tsconfig.json`).
- **Write all documentation in English** — comments, READMEs, and docs. (UI copy is separately localized EN/PT.)
- **Use design tokens, not magic values.** Colors, spacing, radii, shadows, and motion come from `DESIGN-GUIDELINES.md`. Accent is electric cyan `#00D9FF`; v1 is dark-mode only.
