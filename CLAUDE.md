# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Before You Start

- **Read the docs in `/instructions` before making any change.** They are the source of truth for product decisions, scope, interface structure, and the visual design system. Key files:
  - `BRIEF.md` / `PRD.md` — the why and the product positioning.
  - `MVP-SCOPE.md` — what's IN vs OUT, plus the **v1.5 roadmap** (stage order, decisions, per-stage definition of done). Re-read before adding anything; scope creep is the #1 risk.
  - `DESKTOP-INTERFACE-SPEC.md` — structure and behavior of every interface element (boot, logon, taskbar, Start menu, windows, dialogs, mobile, keyboard map, each app).
  - `DESIGN-GUIDELINES.md` — the "DouglasOS XP" design-token source of truth (Luna colors, gradients, type, sizes, bevels, focus, motion, icons, wallpapers, what NOT to use). Implement tokens as Tailwind v4 `@theme` tokens + CSS variables; never hardcode values that have a token.
  - `full-refactor/V1.5-FEATURE-PROMPTS.md` — the analysis behind v1.5 and the self-contained prompt for each stage.
- **v1.5 redesign in progress.** The docs describe the target "DouglasOS XP" shell (a faithful early-2000s Luna-style desktop, branded DouglasOS). Until stage 1 (desktop) and stage 2 (mobile) land, the code still runs the v1 shell (dark glass, menu bar + dock, linear mobile fallback). Check the real component structure before editing.
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

**Installed:**

- Next.js **16.2.7** (App Router) — note: *not* 14, despite what older notes may say.
- React 19, TypeScript 5, Tailwind CSS **v4** (via `@tailwindcss/postcss`), ESLint 9 (flat config).
- shadcn/ui + radix-ui (in-window UI and accessible primitives, restyled to the XP look) · Framer Motion (all animation) · React Three Fiber + Drei (optional animated 3D wallpaper) · Zustand (window/desktop state) · next-intl (EN/PT i18n, EN default) · lucide-react (icons inside window content only; shell icons are own XP-style SVGs).

Follow the conventions in the design + interface specs rather than the library defaults.

## Architecture (big picture)

DouglasOS is a personal portfolio rendered as a fictional desktop operating system. The "interface is the experience" — there is no traditional landing page. Understanding it requires reading the interface + design specs together; the high-level shape:

- **Boot → Logon → Desktop shell.** A boot screen and a one-click logon screen (once per session via `sessionStorage`, skippable) lead to the desktop. The shell is a bottom **taskbar** (green Start button, Quick Launch for CV + Contact, one button per open window, tray with EN/PT toggle and clock), a two-column **Start menu**, and grid-snapped **desktop icons** on a wallpaper. (v1 had a top menu bar + bottom dock; they are replaced in stage 1.)
- **Window manager is the core.** Apps open as draggable, focusable, minimizable, maximizable Luna-style windows. Window state (open set, focus, z-index, positions) lives in **Zustand** — this is the central piece of client state; most interactivity flows through it.
- **7 apps** surface portfolio content: `about`, `experience`, `projects`, `skills`, `how-i-work-with-ai`, `contact`, plus `resume.pdf` which is a **download action, not a window** (file at `public/resume.pdf`). `how-i-work-with-ai` is the marquee/AI-positioning section. Content is **static** (TS/MDX in-repo) — no backend, CMS, or database, ever, for this project.
- **Wallpapers.** The default is an original static wallpaper; the R3F + Drei scene is an **optional animated wallpaper** chosen in Display Properties — lazy-loaded, capped/low-density, and **never loaded on mobile or under `prefers-reduced-motion`**.
- **i18n** is EN-first with a PT toggle (next-intl), locale in the URL (`/en`, `/pt`) and persisted in `localStorage`.
- **Mobile (< 768px) = touchable XP** (stage 2): the same desktop adapted to touch — windows always maximized, single tap opens, press-and-hold = right-click. (v1's linear-scroll fallback is replaced.) Every new feature must define its mobile behavior.
- **Brand safety.** Mechanics are faithful to the Luna era; assets are not. Never use Microsoft names ("Windows", "Microsoft", "XP" as a product name), the flag logo, the Bliss wallpaper, original icons, sounds or verbatim text (see `DESIGN-GUIDELINES.md` → What NOT to use).

Accessibility and `prefers-reduced-motion` are first-class throughout (see the accessibility + reduced-motion sections of the design/interface specs).

**Golden rule for any feature decision:** "Can a recruiter download the CV and reach contact in under 60 seconds without this?" CV and Contact must always stay within 1–2 clicks; fun features (assistant, messenger, recycle bin, music, webcam, Paint, easter eggs) never cover, delay or gate them.

## Conventions

- **Stay within the App Router structure** (`app/`, `components/`, `lib/`, `public/`, etc.). Do not create new top-level folders without asking first.
- **Import alias:** `@/*` maps to the repo root (see `tsconfig.json`).
- **Write all documentation in English** — comments, READMEs, and docs. (UI copy is separately localized EN/PT.)
- **Use design tokens, not magic values.** Colors, gradients, sizes, radii, bevels/shadows and motion come from `DESIGN-GUIDELINES.md`. v1.5 is a single **light Luna theme** (blue chrome, green Start, `#ECE9D8` window bodies, `#316AC5` selection); the v1 cyan `#00D9FF` accent, glassmorphism and dark-only rule are retired (cyan survives only inside the optional 3D wallpaper scene).
