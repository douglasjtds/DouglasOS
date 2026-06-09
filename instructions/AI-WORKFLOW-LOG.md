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
- _Add: specific commands, skills, and integrations as they're used._

### 2. Discovery-first workflow
- Structured PRD/spec process *before* coding — this very repo's `/instructions` set (BRIEF, PRD, MVP-SCOPE, interface + design specs) is the example.
- Gasolinha as a prior example of the same discovery-first habit.
- Clarifying questions and explicit scope decisions captured up front, not mid-implementation.
- _Add: how a feature goes from spec → plan → numbered tasks._

### 3. Productivity multipliers
- Generating accurate project memory (`CLAUDE.md`) so future sessions are productive immediately.
- Breaking large work into resumable, low-context tasks.
- AI catching inconsistencies (e.g., the Next version mismatch) before they cost time.
- _Add: measured time savings / before-after anecdotes as they occur._

### 4. What AI doesn't replace
- Judgment on scope (what belongs in the MVP vs v1.5/v2) — driven by the product's golden rule, decided by a human.
- Architectural decisions and the fixed-stack guardrails (the human sets the constraints; the AI works within them).
- Production debugging and real-world tradeoffs.
- _Add: concrete moments where human judgment overrode or steered the AI._

---

## Build log (append one entry per session)

### 2026-06-09 — Foundation kickoff
- Read all `/instructions` docs before any change (docs-first).
- `/init` → rewrote `CLAUDE.md`; caught the Next 14 → 16 stack mismatch by verifying `package.json`.
- Plan mode: clarified scope (foundation only), i18n timing (now), dependency strategy (foundation-only deps); wrote and got approval on the setup plan.
- Created `SETUP-TASKS.md` (numbered tracker) to execute one task at a time.
- Task 1: cleaned `create-next-app` boilerplate (`page.tsx`, `globals.css`, metadata, removed starter SVGs); `npm run lint` clean.
- Started this AI workflow log as raw material for `how-i-work-with-ai.app`.
- _Next: shadcn init → design tokens → next-intl routing._
