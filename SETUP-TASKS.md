# DouglasOS — Setup & Foundation Tasks

Working checklist for the foundation phase (see `/instructions/MVP-SCOPE.md`). Work through one task at a time; check items off as they complete. Heavier feature work (OS shell, apps, 3D) comes in later phases.

> Scope of this phase: dependencies + design tokens + shadcn + i18n routing + clean base. **Not** in this phase: boot screen, menu bar, dock, windows, the 7 apps, 3D background, Framer Motion, Vercel deploy, full SEO/OG.
>
> Process note: the AI-assisted build process is logged in `instructions/AI-WORKFLOW-LOG.md` (raw material for `how-i-work-with-ai.app`) — append to it as tasks complete.

---

## Task 0 — Task tracker & housekeeping

- [x] Create this `SETUP-TASKS.md`.
- [x] Fix the two markdownlint MD032 warnings in `CLAUDE.md` (blank lines around lists).
- **Done when:** tracker exists and `CLAUDE.md` lints clean.

## Task 1 — Clean the boilerplate

- [x] Replace `app/page.tsx` boilerplate with a minimal dark placeholder.
- [x] Strip default light-mode styles from `app/globals.css` (keep `@import "tailwindcss";` + Geist font mappings).
- [x] Update `app/layout.tsx` metadata (title "DouglasOS", real description).
- [x] Remove unused starter SVGs from `public/` (`next.svg`, `vercel.svg`, `window.svg`, `file.svg`, `globe.svg`).
- **Done when:** `npm run dev` shows a blank dark placeholder, no boilerplate, no console errors.

## Task 2 — shadcn/ui init (before adding our tokens)

- [x] `npx shadcn@latest init -b radix -p nova -y` (CLI v4.11; `nova` preset = Lucide/Geist; Tailwind v4 auto-detected, CSS variables).
- [x] Verify `components.json` + `lib/utils.ts` (`cn`) exist.
- [x] Add `button` as a smoke-test component.
- [x] Fix shadcn's font self-reference in `globals.css` (`--font-sans`/`--font-heading` → `var(--font-geist-sans)`).
- [x] Pin `turbopack.root` in `next.config.ts` (stray home-dir lockfile was mis-rooting the build).
- **Done when:** a shadcn Button renders. ✅ build + lint green.

## Task 3 — Design tokens in `@theme`

- [x] Translate `DESIGN-GUIDELINES.md` palette/shadows/radii into `app/globals.css` (`@theme` + CSS vars): `base-0..4`, `accent*`, `text-*`, semantic, glass, shadows/glows, radii, blur.
- [x] Reconcile shadcn semantic tokens with the palette (background→base-0, primary→accent, foreground→text-primary, …).
- [x] Set `body` to `base-0` / `text-primary`; force dark.
- [x] Add global `prefers-reduced-motion: reduce` handling.
- **Done when:** `bg-base-0` / `text-accent` / `shadow-glow-accent` render; shadcn Button is cyan accent. ✅ build + lint green; verified in compiled CSS.

## Task 4 — next-intl + locale routing (`/en`, `/pt`, EN default)

- [x] `npm i next-intl` (v4.13); confirmed Next 16 App Router support (peer dep `^16.0.0`).
- [x] Wrap `next.config.ts` with `createNextIntlPlugin()` (loads `i18n/request.ts`).
- [x] Add `i18n/routing.ts`, `i18n/request.ts`, `proxy.ts` (localePrefix `always`). **Note:** Next 16 renamed Middleware → Proxy, so the handler lives in `proxy.ts`, not `middleware.ts` (next-intl's `createMiddleware` is filename-agnostic).
- [x] Set `localeDetection: false` so the root (`/`) always redirects to EN (EN-first decision); PT is opt-in via `/pt` or the future toggle.
- [x] Move layout/page under `app/[locale]/`; `NextIntlClientProvider` + `setRequestLocale`; `<html lang={locale}>`; `generateStaticParams` + `hasLocale` 404 guard.
- [x] Add `messages/en.json` + `messages/pt.json` with seed keys (`home.*`).
- **Done when:** `/en` and `/pt` load localized seed text, `/` redirects to default, no hydration errors. ✅ `/` → 307 `/en`; `/en`+`/pt` render localized seed + correct `<html lang>`; dev log clean.

## Task 5 — Verify & document

- [x] `npm run lint` passes.
- [x] `npm run build` passes (`/en` + `/pt` prerendered SSG; Proxy registered).
- [x] Manual `npm run dev` check on `/en` + `/pt` (+ `/` redirect).
- [x] Tracker reflects reality; deferred items noted.
- **Done when:** lint + build green and this tracker is fully checked. ✅

---

### Deferred (upcoming phases)

- OS shell: boot screen, menu bar, dock, desktop icons, window manager (+ Zustand).
- The 7 apps + content; `resume.pdf` download action.
- 3D ambient background (React Three Fiber + Drei); Framer Motion animations.
- Mobile linear fallback; full SEO/OG image; Vercel deploy + Analytics.
