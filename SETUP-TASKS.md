# DouglasOS — Technical Phase Tasks

Working checklist for the **technical / launch-infrastructure phase** (see `instructions/MVP-SCOPE.md`). Work through one task at a time; check items off as they complete.

> Previously completed (see `instructions/AI-WORKFLOW-LOG.md` + git): **Foundation** (boilerplate cleanup, shadcn/ui, design tokens in `@theme`, next-intl `/en`+`/pt` routing) and the **OS shell** (boot screen, menu bar, dock, desktop icons, the full Zustand window manager, and all 7 app shells).
>
> Scope of this phase: avatar/social wiring, 3D ambient background, the real mobile linear-scroll fallback, SEO/OG, Vercel staging deploy. **Not** in this phase: writing the real text content for the 7 apps — that copy is **intentionally deferred** to a later content pass (experience descriptions, project copy, the `how-i-work-with-ai` narrative, years stat all stay as `TODO_*`).
>
> Process note: append to `instructions/AI-WORKFLOW-LOG.md` as tasks complete (raw material for `how-i-work-with-ai.app`). Keep `npm run lint` + `npm run build` green after every task.

---

## Task 1 — Wire in available assets (avatar + social URLs)

- [ ] Add the avatar to `public/` (e.g. `public/avatar.jpg`); replace the placeholder circle in `components/apps/AboutApp.tsx` (use `next/image`, keep rounded/token styling).
- [ ] Replace the `/TODO` LinkedIn + GitHub URLs in `components/apps/ContactApp.tsx` with the real profiles.
- **Gated on:** Douglas providing the image file + the two URLs.
- **Done when:** `about.app` shows the real photo, `contact.app` links resolve to real profiles, lint + build green.

## Task 2 — 3D ambient background (React Three Fiber + Drei)

- [ ] Install `three @react-three/fiber @react-three/drei` (pre-approved target stack per `CLAUDE.md`). Check `node_modules/next/dist/docs/` for any Next 16 client-component nuances first.
- [ ] Build a low-density ambient scene per the 3D section of `DESIGN-GUIDELINES.md` (drifting particles / code fragments, cyan/purple, subtle drift).
- [ ] Lazy-load after critical UI via `next/dynamic({ ssr: false })`; render behind `Desktop` (z below icons/windows), `pointer-events-none`. Cap pixelRatio + particle count.
- [ ] **Disable entirely** on `<768px` (`useMediaQuery`) and under `prefers-reduced-motion` (`useReducedMotion`).
- **Done when:** subtle ambient motion ≥30fps, doesn't block clicks, absent on mobile + reduced-motion, no SSR/hydration errors, build green.

## Task 3 — Real mobile linear-scroll fallback (replace `MobilePlaceholder`)

- [ ] Replace the "best on desktop" placeholder rendered by `ShellGate` with the real linear page: hero (name/headline/avatar) → About → Experience → Projects → Skills → How I Work with AI → Contact + CV download, plus a subtle "best on desktop" banner.
- [ ] **Reuse the same i18n message keys.** Prefer reusing the existing app content components where they render cleanly outside a window; otherwise lightweight section components sharing the same design tokens. Dark-only.
- **Done when:** `<768px` shows full linear content (placeholder copy is fine for now), CV download works, responsive across phone widths, build green.

## Task 4 — SEO basics + OG image

- [ ] Per-locale `generateMetadata` in `app/[locale]/layout.tsx` (title, description, `alternates`/hreflang for en/pt, `openGraph`, `twitter`).
- [ ] OG image: static screenshot of the built desktop in `public/`, referenced in metadata.
- [ ] Add `app/sitemap.ts` + `app/robots.ts`; add `Person` JSON-LD.
- **Done when:** Lighthouse SEO ≥95, OG card previews correctly, sitemap/robots resolve, build green.

## Task 5 — Vercel deploy (staging) + Analytics

- [ ] Deploy to a Vercel preview/staging URL. **`noindex` while content is placeholder** (don't index `TODO` copy).
- [ ] Add `@vercel/analytics`, mount in the root layout.
- **Done when:** staging URL loads boot→desktop, analytics events register, no prod console errors.

## Task 6 — Verify & document

- [ ] `npm run lint` + `npm run build` green.
- [ ] `npm run test` (Vitest unit/integration) + `npm run test:e2e` (Playwright, all browsers) green. Extend the e2e specs in `e2e/` to cover any new flow this phase adds (e.g. the real mobile page, 3D-disabled paths).
- [ ] Append phase progress to `AI-WORKFLOW-LOG.md`; tracker fully checked.
- **Done when:** lint + build + unit + e2e green, this tracker is fully checked.

> **Testing infrastructure** is set up (Vitest + Testing Library for unit/integration, Playwright for e2e, GitHub Actions CI). See the Testing section in `CLAUDE.md` for commands and conventions. Unit coverage is strongest on `lib/store/*`; e2e covers boot + window-manager + i18n + mobile + reduced-motion.

---

### Deferred (next, after this phase)

- **All real text content** for the 7 apps — experience role descriptions, project copy/links, the `how-i-work-with-ai` narrative, years stat. The intentionally-deferred content pass.
- **Production launch:** remove `noindex`, custom domain, social announcement — after content lands.
- **P1 polish:** window snap-to-edge, keyboard shortcuts (Cmd/Ctrl+W, Tab cycle), window resize, dock magnification refinement, loading skeleton states.
