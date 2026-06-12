# AI Workflow Log — DouglasOS

> **What this file is:** raw material, **not final copy**. It captures how DouglasOS is being built *with* Claude (Claude Code), so the real process becomes concrete evidence for the `how-i-work-with-ai.app` section. Later, the copywriter skill distills this into polished, on-brand copy. Keep it append-only and specific — concrete examples beat buzzwords.
>
> **Feeds:** `how-i-work-with-ai.app` (see `DESKTOP-INTERFACE-SPEC.md` → its four subsections, mirrored below).

---

## Meta — How DouglasOS itself is being built with Claude

A live, self-referential example: the portfolio that argues "AI-First Fullstack" is itself built with an AI-first process. Observed practices so far:

- **Docs-first, not vibes-first.** `CLAUDE.md` mandates reading every doc in `/instructions` (BRIEF, PRD, MVP-SCOPE, DESKTOP-INTERFACE-SPEC, DESIGN-GUIDELINES) before touching code. The product specs are the source of truth; the AI works from them rather than improvising.
- **Verify instead of assume.** Running `/init` to generate `CLAUDE.md` surfaced a real mismatch: the docs said "Next.js 14," but `package.json` pins **Next 16.2.7** with Tailwind v4 and React 19. Caught by checking the actual lockfile/config, not trusting memory or stale notes.
- **Plan before code.** Used plan mode with structured clarifying questions (scope boundary, i18n timing, dependency strategy) and explicit recommended defaults, producing a written plan reviewed and approved before any edit.
- **Small, numbered tasks to protect context.** Work split into a `SETUP-TASKS.md` checklist, executed one at a time, checking items off as they land — deliberately keeping each pass small so the context window stays focused and reviewable.
- **Verification discipline.** Lint/build run after changes; "done when" criteria defined per task before starting.
- **Respect the guardrails.** Fixed stack (no introducing alternatives without asking), App Router structure only, English docs, scope discipline via the MVP "golden rule" (recruiter → CV + contact in under 60s).

---

## Buckets — to fill as the build progresses

> Mapped to the four `how-i-work-with-ai.app` subsections. Seed notes below; add concrete examples over time.

### 1. Daily tooling

- Claude Code as the primary build agent for DouglasOS (docs-first reads, plan mode, task execution).
- GitHub Copilot for inline completion in day-to-day work.
- Internal MCP servers at work (e.g., at Serasa Experian) wiring company context/tools into the AI loop.
- Automated testing stack: Vitest + Testing Library (unit/integration, jsdom), Playwright (cross-browser e2e), GitHub Actions CI running lint + build + unit + e2e on every push/PR.
- *Add: specific commands, skills, and integrations as they're used.*

### 2. Discovery-first workflow

- Structured PRD/spec process *before* coding — this very repo's `/instructions` set (BRIEF, PRD, MVP-SCOPE, interface + design specs) is the example.
- Gasolinha as a prior example of the same discovery-first habit.
- Clarifying questions and explicit scope decisions captured up front, not mid-implementation.
- *Add: how a feature goes from spec → plan → numbered tasks.*

### 3. Productivity multipliers

- Generating accurate project memory (`CLAUDE.md`) so future sessions are productive immediately.
- Breaking large work into resumable, low-context tasks.
- AI catching inconsistencies (e.g., the Next version mismatch) before they cost time.
- *Add: measured time savings / before-after anecdotes as they occur.*

### 4. What AI doesn't replace

- Judgment on scope (what belongs in the MVP vs v1.5/v2) — driven by the product's golden rule, decided by a human.
- Architectural decisions and the fixed-stack guardrails (the human sets the constraints; the AI works within them).
- Production debugging and real-world tradeoffs.
- Whether to invest in a testing layer at all: automated tests are explicitly out of MVP v1, so adopting a full unit + e2e suite was a deliberate human call, not an AI default.
- *Add: concrete moments where human judgment overrode or steered the AI.*

---

## Build log (append one entry per session)

### 2026-06-09 — Foundation kickoff

- Read all `/instructions` docs before any change (docs-first).
- `/init` → rewrote `CLAUDE.md`; caught the Next 14 → 16 stack mismatch by verifying `package.json`.
- Plan mode: clarified scope (foundation only), i18n timing (now), dependency strategy (foundation-only deps); wrote and got approval on the setup plan.
- Created `SETUP-TASKS.md` (numbered tracker) to execute one task at a time.
- Task 1: cleaned `create-next-app` boilerplate (`page.tsx`, `globals.css`, metadata, removed starter SVGs); `npm run lint` clean.
- Started this AI workflow log as raw material for `how-i-work-with-ai.app`.
- Task 2: `shadcn` init (v4.11, `nova` preset = Lucide/Geist) + `button`; fixed a font self-reference bug in `globals.css`; pinned `turbopack.root` to silence a stray-lockfile root warning. Build + lint green.
- Task 3: translated `DESIGN-GUIDELINES.md` into Tailwind v4 `@theme` tokens (palette, glass, shadows/glows, radii, blur) so utilities (`bg-base-0`, `text-accent`, `shadow-glow-accent`, `rounded-window`) and matching `:root` CSS vars come from one source. Reconciled shadcn semantic tokens onto the palette (`primary`→cyan accent, `background`→base-0, `foreground`→text-primary); forced dark (`html.dark` + `color-scheme: dark`); added a global `prefers-reduced-motion` reset. Verified the tokens compiled to the right values by grepping the built CSS rather than eyeballing — accent resolves to `#00d9ff`, glow to a 24px cyan shadow. Build + lint green.
  - *Judgment call worth noting:* the design system and shadcn both claim the word "accent." Checked the actual nova Button source first — it hovers via `bg-muted`, not `bg-accent` — so unifying `accent`→brand cyan was safe and kept neutral hovers subtle, instead of forking component internals. (Bucket: "what AI doesn't replace" — reading the real code beat assuming the library's defaults.)
- Task 4: next-intl (v4.13) locale routing. Before writing any framework code, read the bundled Next 16 docs and caught a breaking change: **Middleware was renamed to Proxy** (`proxy.ts`, not `middleware.ts`). Verified against the Next source that both filenames are still accepted (so no hard break) and that next-intl's `createMiddleware` is filename-agnostic, then chose the forward-looking `proxy.ts`. Wrapped `next.config.ts` with `createNextIntlPlugin()`; added `i18n/routing.ts` + `i18n/request.ts`; moved layout/page under `app/[locale]/` with `NextIntlClientProvider`, `setRequestLocale`, `generateStaticParams`, and a `hasLocale` 404 guard. Seed messages in `messages/en.json` + `messages/pt.json`. Build prerenders `/en` + `/pt` as SSG; verified at runtime: `/` → 307 `/en`, each locale renders its own copy + correct `<html lang>`, dev log clean.
  - *Product decision surfaced to the human, not assumed:* asked up front whether the root `/` should auto-detect the browser language or always default to EN. Chose EN-first (`localeDetection: false`) — PT is reachable via an explicit `/pt` link (great for sharing with a Brazilian recruiter) or the future toggle, but the bare domain is deterministic. (Bucket: "what AI doesn't replace" — the routing default is a UX/positioning call, made by the human.)
  - *Judgment call worth noting:* `SETUP-TASKS.md` literally said "add `middleware.ts`," but the docs-first check overrode the stale instruction with the correct Next 16 convention — and the deviation was documented in the tracker rather than silently applied. (Bucket: "AI catching inconsistencies before they cost time.")
- *Next: foundation phase complete (Tasks 0–5). Next phase: OS shell — boot screen, menu bar, dock, window manager + Zustand.*

### 2026-06-09 — OS shell phase

- Plan-first, again: entered plan mode and asked three scope questions up front — Framer Motion now vs deferred, real app content vs placeholders, mobile as full linear page vs minimal placeholder — each with a recommended default, and got explicit answers before any code. (Bucket: discovery-first.)
- Designed the hardest part before coding: dispatched a Plan subagent to design the window manager — the Zustand store shape and specifically the `AnimatePresence` + store exit-animation problem (close = unmount, plays the `exit` variant; minimize = stays mounted, animates via a variant). Designing the tricky interaction on paper first avoided a rewrite. (Bucket: discovery-first / productivity multipliers.)
- Split the build into 12 small, independently-verifiable subtasks, each with a "done when" check; ran lint + typecheck after every one so context stayed focused and regressions stayed local. (Bucket: productivity multipliers.)
- Verify-don't-assume, three times: (a) the strict `react-hooks/set-state-in-effect` rule flagged the usual "mounted" pattern, so instead of disabling it I moved `useMounted`/`useMediaQuery` to `useSyncExternalStore` — the rule-compliant idiom; (b) `lucide-react` in this version no longer exports brand icons (`Github`/`Linkedin`) — confirmed by introspecting the package's real exports via `node`, then swapped to neutral icons rather than guessing names; (c) confirmed `NextIntlClientProvider` needs `messages` passed explicitly for client components to translate, and wired it. (Bucket: AI catching inconsistencies before they cost time.)
- Closed the loop in a real browser, not just on green builds: drove headless Chromium (Playwright resolved from the npx cache, no project dependency added) through the running app — boot → desktop, open windows, cascade/focus, maximize, EN↔PT toggle, and the <768px mobile gate — capturing screenshots and confirming zero console errors. Evidence before "done." (Bucket: productivity multipliers / daily tooling.)
- Human integrity call the AI deferred to: rather than fabricate a real person's employment dates, project descriptions, or bio, the human chose "draft + clearly-marked placeholders." The AI wrote layout and spec-confirmed facts only (real roles, companies, skills, email) and left `TODO_*` markers for everything unverifiable. (Bucket: what AI doesn't replace — judgment about the truthfulness of a portfolio.)
- Scope discipline straight from the spec: `MVP-SCOPE.md` lists keyboard shortcuts (Tab window-cycling, Cmd+W) as v1.1, so I deliberately didn't over-build them — implemented only `Esc`-to-close and spent the effort on first-class accessibility instead (focus moves into a window on open, returns to its dock launcher on close, ARIA roles/labels throughout). (Bucket: what AI doesn't replace — scope judgment.)
- *Next: OS shell complete (boot screen, menu bar, dock, window manager + Zustand, 7 apps with real-but-placeholder content). Remaining here: fill real content (employment dates, project details, bio, social URLs, `public/resume.pdf`, avatar). Later phases: 3D ambient background, full mobile linear page, SEO/OG, deploy.*

### 2026-06-12 — Testing infrastructure (Vitest + Playwright + CI)

- **The decision to test at all was a human scope call, surfaced not assumed.** Automated tests are explicitly *out* of MVP v1 — `MVP-SCOPE.md` centers manual QA + Lighthouse + cross-browser smoke, and `CLAUDE.md` says "confirm the framework choice first." Rather than silently honor the spec or silently add a runner, the AI raised the conflict; the human chose to stand up the full unit + e2e suite now. A deliberate, documented exception to the golden rule — the same pattern as the resize/persist entry below. (Bucket: what AI doesn't replace — scope judgment.)
- **Discovery-first: framework choices made up front, with trade-offs.** Ambition (full suite vs foundation-only), runner (Vitest + Testing Library vs Jest), e2e tool (Playwright vs Cypress), and CI strategy (run everything; coverage as a *report*, no hard gate) were each put as explicit questions with recommended defaults *before* anything was installed. (Bucket: discovery-first.)
- **Leaned on the codebase's own testability seams instead of refactoring.** `lib/store/geometry.ts` and `desktopGrid.ts` were already written as pure, viewport-injected helpers (the file comment literally says "trivially testable"), and the Zustand stores isolate state transitions — so the unit layer tested real logic directly, no production rework. Strongest coverage lives in `lib/store/*` by design. (Bucket: productivity multipliers.)
- **Verify-don't-assume, three times.** (a) This jsdom build ships a non-functional `localStorage`, which broke the Zustand `persist` middleware — diagnosed from the actual failure, then fixed by installing an in-memory `Storage` in `test/setup.ts` rather than guessing. (b) The boot wordmark "DouglasOS" collided with the menu-bar logo under text selectors → added a stable `data-testid="boot-screen"` instead of brittle text matching. (c) Firefox rejects `isMobile` in its context options → the mobile spec drives the breakpoint via `viewport` alone, since the shell only keys off the width media query. (Bucket: AI catching inconsistencies before they cost time.)
- **The resulting shape.** Two layers: Vitest + Testing Library (jsdom, co-located `*.test.ts(x)`) and Playwright (`e2e/`, boot → desktop-shell flows across Chromium/Firefox/WebKit — directly serving the MVP's cross-browser requirement). Two CI jobs (`verify` + `e2e`) in `.github/workflows/ci.yml`; coverage reported, not gated, to avoid friction while the base grows. E2E prefers resilient selectors (roles, `data-*`) over app copy, which is still placeholder. This is the foundation the resize/persist work below then built on with real TDD.

### 2026-06-12 — Resizable windows + persisted session

- **The AI surfaced a scope conflict instead of just building what was asked.** Request: make windows resizable and restore state on the next visit. Before coding, the docs-first read flagged that both are explicitly *out* of MVP v1 — `MVP-SCOPE.md` lists window resize as P1 ("adds dev complexity; fixed sizes work for v1") and never lists state persistence. Rather than silently honor the spec *or* silently override it, the AI raised the conflict; the human (project owner) made the call to build it anyway. A deliberate, documented exception to the "golden rule," decided by a person. (Bucket: what AI doesn't replace — scope judgment.)
- **Decisions pushed to the human, not assumed.** Two product choices were put up front with trade-offs and visual previews, not guessed: *what* to persist (remember geometry only vs full session restore) and *which* resize handles (all 8 edges+corners vs corners only). Human chose full session restore + all 8. (Bucket: discovery-first.)
- **Reused the codebase's own conventions instead of inventing.** Resize mirrored the existing `useDrag` pointer pattern (capture-on-down, imperative `getState()` writes, store owns viewport clamping); persistence copied `desktopStore`'s `persist` setup verbatim (`partialize` + `merge` to drop stale keys); the resize math went into the existing pure, viewport-injected `geometry.ts` helpers. New surface area stayed minimal and idiomatic. (Bucket: productivity multipliers.)
- **TDD, for real (RED → GREEN).** Wrote failing tests first for each pure unit and watched them fail for the right reason before implementing: `resizeRect`/`clampSize` (13 cases — per-edge anchoring, min-size floor pins the opposite edge, viewport bounds), the `resizeWindow` store action, the `reconcilePersisted` reload-reconciler, and the `useResize` hook. 64 unit tests green. (Bucket: productivity multipliers / verification discipline.)
- **Verify-don't-assume, twice.** (a) Before wrapping the store in `persist`, checked the actual `ShellGate` — it renders a neutral surface until a post-mount media query resolves, so windows never produce SSR HTML; that's *why* no `skipHydration` is needed, confirmed by reading the component rather than assuming. (b) The obvious `isAppId` helper turned out to be too loose (only excludes `"resume"`), so stale persisted windows for removed apps would survive — built a real `KNOWN_APP_IDS` set from `WINDOW_APPS` instead. (Bucket: AI catching inconsistencies before they cost time.)
- **Diagnosed a flaky test as a test problem, not a code problem — and hardened it honestly.** New Playwright specs (resize an edge; size survives a reload) flaked under parallel workers: a synthetic pointer-drag on a thin handle was occasionally dropped. Re-ran the case solo to prove the resize logic was correct (passed every time), then fixed the *test* the idiomatic way — `expect(...).toPass()` retries the interaction so a dropped drag re-fires, while a genuine regression would still fail every attempt — and widened the edge hit-zones to 8px (better grab affordance too). Confirmed 35/35 stable across 5 parallel repeats. Resisted the temptation to mask it with a blanket `waitForTimeout`. (Bucket: what AI doesn't replace — knowing the difference between a flaky test and a broken feature.)
- *Next: real content still pending (dates, project details, bio, social URLs, `resume.pdf`, avatar). If resize/persist stay in v1, reconcile `MVP-SCOPE.md` so the doc matches the build.*
