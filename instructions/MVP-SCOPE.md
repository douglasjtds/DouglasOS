# DouglasOS — MVP Scope

**Date:** March 2026 (v1) · updated November 2026 (v1.5 plan)
**Version:** 1.5

> **Status:** v1 (MVP) is feature-complete. v1.5 — the "DouglasOS XP" redesign plus a staged feature set — is planned below in [Post-MVP Roadmap](#post-mvp-roadmap--v15-douglasos-xp). Sections describing v1 are kept as the historical record; where a v1 rule has been superseded, it is marked **(superseded in v1.5)**.

---

## MVP Vision

**In one sentence, what does the MVP do?**
> An interactive personal portfolio that presents Douglas Tertuliano as an AI-First Fullstack Developer through a custom "DouglasOS" desktop interface with 7 functional apps, working on desktop with a clean mobile fallback.

**What hypothesis are we testing?**
> A memorable, brand-driven portfolio generates meaningfully more qualified recruiter contacts than a generic developer portfolio, especially for international remote roles.

**How will we know it worked?**
- Within 3 months of launch: 5+ qualified recruiter contacts/month
- 500+ monthly unique visitors
- 10% CV download rate per visit

---

## Scope: What's IN

### Must Have (P0) — No launch without this

| Feature | Description | Done When |
|---------|-------------|-----------|
| Boot screen | 2-3s animated DouglasOS logo intro | Loads cleanly, can be skipped after 1s, doesn't replay on navigation |
| Menu bar (top) **(superseded in v1.5 → taskbar)** | DouglasOS logo, active app name, clock, EN/PT toggle | Visible always, sticky, functional toggle |
| Dock (bottom) **(superseded in v1.5 → taskbar + Start menu)** | Hover-effected shortcuts to all 7 apps | Icons scale on hover, opens app on click, indicator for open apps |
| Desktop icons | 7 app icons arranged on desktop | Click opens window, double-click also works, visual focus state |
| Window manager | Drag, minimize, maximize, close, focus | Multiple windows work simultaneously, z-index correct, smooth animations |
| `about.app` | Photo, name, headline, summary paragraph | Content matches CV; localized |
| `experience.app` | Career timeline with all roles | All 6 roles (Serasa → Rumo) visible; Serasa highlighted; localized |
| `projects.app` | Featured projects (Gasolinha, Wedding Post, optional others) | 2-3 projects with screenshots/descriptions; links to live or repo |
| `skills.app` | Tech stack visually organized | Grouped by category (Backend, Frontend, Databases, Cloud, AI tools) |
| `how-i-work-with-ai.app` | Narrative on AI-first approach | Concrete examples (Claude Code at Serasa, MCP usage, discovery process); localized |
| `resume.pdf` icon | Triggers PDF download on click | Click → download starts; no window opens; uses up-to-date PDF |
| `contact.app` | Links to LinkedIn, GitHub, email, WhatsApp | All links work; copy-to-clipboard for email; localized labels |
| 3D background (light) **(v1.5: optional animated wallpaper)** | Ambient floating code/particles via R3F | Renders smoothly, doesn't block interaction, respects reduced-motion |
| i18n EN/PT | All UI and content translated | Toggle switches instantly; URL reflects locale (`/en`, `/pt`); EN is default |
| Mobile fallback **(superseded in v1.5 → touchable XP)** | Linear scroll version of same content | Fully responsive on phones; no OS metaphor; clean and polished |
| SEO basics | Meta tags, OG image, sitemap | Lighthouse SEO ≥ 95; OG card looks good on social shares |
| Vercel deploy | Production deployment | Live URL accessible; analytics tracking |

### Should Have (P1) — Important but can wait for v1.1

| Feature | Description | Why not P0 |
|---------|-------------|------------|
| Window snap to edges | Snap when dragged near screen edge | UX polish, not blocking core flow |
| Keyboard shortcuts | Cmd/Ctrl+W to close window, Tab to navigate | Accessibility win but not core |
| Window resize | Drag corner to resize windows | Adds dev complexity; fixed sizes work for v1 |
| Animated icons on hover | Subtle micro-animations on dock icons | Nice-to-have polish |
| Loading skeleton states | Skeleton UI inside windows while content mounts | Content is mostly static; impact minimal |
| Analytics events for app opens | Track which apps get opened most | Insights for v2 prioritization |

### Could Have (P2) — Nice to have

| Feature | Description | Consider When |
|---------|-------------|---------------|
| Light mode toggle **(moot in v1.5: the XP theme is light-only)** | Switch between dark and light themes | Multiple recruiters mention dark mode aversion |
| Wallpaper picker **(moved to v1.5 stage 1: Display Properties)** | User picks desktop background | Adds personality; if v1 gets traction |
| App icons with notification dots | Indicate "new" content | If portfolio is regularly updated |

---

## Scope: What's OUT

### Explicitly Out of MVP

| Feature | Why not included | When to reconsider |
|---------|------------------|---------------------|
| Functional terminal with commands | High complexity (parser, command logic, history) | v1.5 replaces it with **Run… + command palette** (stage 7), no shell emulation |
| Tic-tac-toe / games | Polish feature, not core differentiator | v1.5 brings Paint (stage 10); Solitaire and other games stay a **future idea** |
| Easter eggs | Discoverability is wasted if base experience isn't solid | **v1.5** (recycle-bin jokes, "DON'T OPEN THIS.exe") — never blocking CV/contact |
| AI Assistant chat (LLM) | Token cost, abuse risk, infrastructure needs | **Still out.** v1.5 ships *scripted* assistant + scripted messenger instead (no LLM, no backend) |
| Heavy 3D scene (bruno-simon style) | Massive scope; learning curve; performance risk | v2 after validation |
| Sound effects (boot, click) | Most recruiters browse with sound off | v1.5 only as user-started audio (media player, stage 8) with volume/mute; no system sounds |
| Mobile OS metaphor adaptation | Doubles design/dev work | **v1.5 stage 2** ("Mobile = touchable XP") |
| Blog or articles section | Content production overhead | If content strategy emerges later |
| Project case studies (deep) | Long-form requires time investment | Post-launch, one at a time |
| Custom file system simulation | Adds zero value to core goal | Never (or v3 if portfolio becomes a product itself) |
| Real-time multiplayer / shared sessions | Out of scope of a portfolio | Never |
| Backend / database | Content is static | Never for this project |

### Common Temptations to Avoid

- [ ] Building "just one more app" before launch
- [ ] ~~Pixel-perfect macOS replication~~ → v1.5: **faithful to the XP (Luna) look, but DouglasOS-branded** — no Microsoft names, logos, wallpapers, icons, sounds or verbatim text
- [ ] Overly long boot sequence "for cinematics"
- [ ] Complex preferences/settings panel
- [ ] Multiple themes/skins (v1.5 has one Luna theme; wallpapers are the only personalization)
- [ ] Animation libraries beyond Framer Motion
- [ ] State management libraries beyond Zustand
- [ ] Server-side anything that could be static

---

## Simplification Decisions

### Authentication
- [x] **None** — public site, no accounts

### Billing
- [x] **None** — personal portfolio

### Content Management
- [x] **Static MDX/TS files** — no CMS, no admin panel
- [x] **Updates via PR/commit** — content lives in repo

### UI/UX
- [x] **Dark mode only in v1** (light mode could come later if requested) — **superseded in v1.5:** single light Luna theme
- [x] **Desktop-first metaphor**, mobile gets linear fallback — **superseded in v1.5:** "Mobile = touchable XP"
- [x] **shadcn/ui default + dark customization** — no full design system from scratch (v1.5: shadcn/radix behavior with XP styling)
- [x] **No onboarding tutorial** — interface is self-explanatory; subtle hover cues only

### State
- [x] **Zustand for window state** — no Redux overkill
- [x] **localStorage for locale and (optional) wallpaper preference** — no backend
- [x] **No real-time anything** — static content, client-side only

### 3D
- [x] **Light ambient effects only** — no heavy scene, no physics, no models
- [x] **Lazy-loaded** — doesn't block initial paint
- [x] **Disabled with reduced-motion** — accessibility

---

## Personas in MVP

### Primary Persona (full focus)

**Name:** International Tech Recruiter
**Profile:** US/EU-based, English-speaking, sourcing for remote roles, scans 50+ portfolios/day
**Job to be Done:** "Quickly determine if this candidate fits an open role and grab their CV"

### Secondary Persona (supported)

**Name:** Hiring Manager / Tech Lead
**Profile:** Has 5-15 minutes to evaluate; wants depth on projects and AI proficiency
**Job to be Done:** "Assess technical fit beyond the resume"

### Personas OUT of MVP

| Persona | Why not now |
|---------|-------------|
| Anonymous casual visitor | Not the user we optimize for; metaphor will still entertain them |
| Recruiter who only browses on mobile | Served by linear fallback in v1; **v1.5 stage 2 serves them with the touchable XP desktop** |
| Visually impaired user using screen reader | Mobile fallback content is accessible; metaphor isn't ideal for SR but content is reachable |

---

## Critical User Flows

### Flow 1: Recruiter downloads CV (most important)

```
1. Visitor lands on URL (desktop)
2. Boot screen plays (2-3s)
3. Desktop reveals with apps
4. Visitor sees `resume.pdf` icon clearly
5. Clicks icon → PDF download triggers
6. Visitor opens CV in their PDF reader
7. Visitor optionally clicks `contact.app` for outreach info
```

### Flow 2: Hiring manager explores deeply

```
1. Visitor lands on URL
2. Boot screen plays
3. Desktop reveals
4. Visitor opens `about.app` → reads summary
5. Visitor opens `experience.app` → scrolls timeline
6. Visitor opens `how-i-work-with-ai.app` → reads narrative
7. Visitor opens `projects.app` → explores featured work
8. Visitor opens `contact.app` → notes contact info
```

### Flow 3: Mobile visitor (fallback — v1; replaced by touchable XP in v1.5 stage 2)

```
1. Visitor lands on URL (mobile detected)
2. Linear page loads (no boot screen)
3. Hero with name + headline visible immediately
4. Visitor scrolls: About → Experience → Projects → Skills → How I Work with AI → Contact
5. CV download button visible in Contact section
6. Subtle banner: "Best on desktop for full experience"
```

---

## Tech Stack for MVP

### Definitive Choices

| Layer | Technology | Justification |
|-------|------------|---------------|
| Framework | Next.js 16 App Router (originally planned as 14+) | SSR for SEO, modern DX, Vercel-native |
| Language | TypeScript | Type safety, better tooling |
| Styling | Tailwind CSS | Speed, consistency, no naming overhead |
| Components | shadcn/ui | Customizable, well-built, dark-friendly |
| Animations | Framer Motion | Best-in-class for React animations |
| 3D | React Three Fiber + Drei | React-idiomatic Three.js wrapper |
| State | Zustand | Lightweight, simple, perfect for window state |
| i18n | next-intl | Modern, App Router-compatible |
| Deploy | Vercel | Zero config, free tier sufficient |
| Analytics | Vercel Analytics | Native, privacy-friendly |

### What NOT to use (unnecessary complexity)

- [ ] Redux / Redux Toolkit (Zustand suffices)
- [ ] tRPC (no API needed)
- [ ] GraphQL (no API needed)
- [ ] CMS (Contentful, Sanity, etc.) — static content is fine
- [ ] Authentication libraries (no users)
- [ ] Form libraries (no forms; the v1.5 messenger "leave a message" form is a plain controlled form that builds a mailto/wa.me link)
- [ ] Database / ORM (no data)
- [ ] WebSockets (no real-time)
- [ ] Service Workers (PWA not needed for v1)

---

## Estimated Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup & Foundation | 2-3 days | Repo, Next.js, Tailwind, shadcn, Vercel, base tokens, i18n config |
| OS Shell | 5-7 days | Boot screen, menu bar, dock, desktop, window manager (drag/minimize/close) |
| App Content | 5-7 days | All 7 apps with real content from CV + Gasolinha/Wedding Post |
| 3D Background | 2-3 days | R3F ambient scene with particles/code effect |
| i18n Complete | 2 days | All strings localized, toggle functional |
| Mobile Fallback | 2-3 days | Linear responsive layout polished |
| Polish & QA | 3-4 days | Performance tuning, accessibility, cross-browser testing |
| Launch | 1 day | Production deploy, social announcement, LinkedIn update |
| **Total** | **~3-4 weeks** | (in parallel with other projects) |

---

## Definition of Done (MVP)

The MVP is ready to launch when:

- [ ] All P0 features functional on desktop
- [ ] All 7 apps display complete, accurate content
- [ ] Window manager works smoothly with 3+ windows open
- [ ] 3D background renders without blocking interaction
- [ ] EN/PT toggle works flawlessly with no broken strings
- [ ] Mobile fallback delivers all content cleanly
- [ ] Lighthouse Performance ≥ 80 (desktop), ≥ 70 (mobile)
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Lighthouse SEO ≥ 95
- [ ] OG image renders correctly on Twitter, LinkedIn share previews
- [ ] CV download works on all major browsers
- [ ] All external links open in new tab
- [ ] No console errors in production
- [ ] Tested on Chrome, Firefox, Safari, Edge (latest)
- [ ] Tested on iOS Safari, Android Chrome
- [ ] Vercel Analytics confirmed active
- [ ] At least one external reviewer (peer dev) has tried it and given feedback
- [ ] Domain decision made and configured (or staging URL accepted)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep ("just one more feature") | High | High | Re-read this doc weekly; defer everything to v1.5 |
| R3F / Three.js learning curve | Medium | Medium | Start with simple particle system; use AI assistance heavily; Drei has many primitives |
| 3D hurts mobile performance | Medium | Medium | Disable 3D on mobile entirely; linear fallback doesn't need it |
| Window dragging feels janky | Medium | Medium | Test on lower-end hardware early; use `transform: translate3d` for GPU |
| Content production takes longer than expected | Medium | High | Have CV PDF + LinkedIn as fallback content; don't perfectionism content |
| Tech debt from rapid build | High | Low | Accept for MVP; document in `TODO.md`; refactor in v1.5 |
| Domain not ready at launch | Low | Low | Use Vercel preview URL initially; switch domain later |

---

## Hypotheses to Validate

| Hypothesis | How to Validate | Success Looks Like |
|------------|----------------|---------------------|
| Memorable portfolio → more recruiter contacts | Track DMs/emails monthly pre vs post launch | > 3x increase within 3 months |
| AI-First positioning resonates internationally | Track origin of recruiter outreach (companies, regions) | At least 50% from non-BR companies |
| Recruiters can find/download CV easily | Track CV download events / unique visits | > 10% conversion |
| Site is shareable on dev social media | Track external referrer traffic | > 20% from non-direct sources within first month |
| Mobile fallback retains engagement | Compare bounce rate mobile vs desktop | Mobile bounce < 1.5x desktop bounce |

---

## Post-MVP Roadmap — v1.5 "DouglasOS XP"

> Source analysis and per-stage prompts: `instructions/full-refactor/V1.5-FEATURE-PROMPTS.md`. Visual system: `DESIGN-GUIDELINES.md`. Interface: `DESKTOP-INTERFACE-SPEC.md`.

### Decisions (recorded November 2026)

| Decision | Before (v1) | v1.5 |
|----------|-------------|------|
| Visual identity | Dark, glass, cyan `#00D9FF`, macOS-like menu bar + dock | Faithful early-2000s **Luna-style desktop** (taskbar, Start menu, Luna windows), **DouglasOS-branded** — no Microsoft names/logos/wallpapers/icons/sounds/text |
| "Pixel-perfect macOS replication" temptation | Avoid — DouglasOS is its own thing | **Faithful to XP, but with the DouglasOS brand** |
| Mobile | "Mobile drops the metaphor" — linear fallback | **"Mobile = touchable XP"** — same desktop adapted to touch |
| 3D background | Always on (desktop) | Optional **animated wallpaper** in Display Properties; default is an original static wallpaper |
| AI chat with an LLM | Out (cost, abuse) | **Still out** (cost and abuse). The assistant and the messenger are **scripted** — no LLM, no backend |
| Easter eggs, sound, games | Out of MVP, "v1.5" | **In v1.5**, but they never get in the way of the CV or contact. Sound only when the user starts it |
| Solitaire / other games | — | **Future idea**, not in v1.5 |
| Terminal | v1.5 candidate | Replaced by **Run… + command palette** (stage 7) |

### Order of work

| # | Stage | Summary |
|---|-------|---------|
| 0 | Docs | Roadmap + "DouglasOS XP" design system (this update) |
| 1 | **XP refactor — desktop** | Luna tokens, boot + logon, taskbar (Start, Quick Launch, window buttons, tray), Start menu, Luna windows, own XP-style icons, original wallpaper + Display Properties (3D becomes optional) |
| 2 | **XP refactor — mobile** | Touchable XP replacing the linear `MobileFallback` |
| 3 | External shortcuts | LinkedIn / GitHub / WhatsApp / e-mail on the desktop and in All Programs (URLs only from `lib/profile.ts`) |
| 4 | Case studies in a browser window | Projects as case studies in "DouglasOS Explorer": address bar, history, themed "not found" |
| 5 | "mini Douglas" assistant | Scripted desktop companion (tips, shortcuts, offline keyword search), dances when clicked — no LLM, no backend |
| 5b | "DouglasOS Messenger" | Scripted MSN-style chat with "Douglas" (intents shared with the assistant) ending in a **real message** sent via `mailto:` or WhatsApp (`wa.me`) — no LLM, no backend |
| 6 | Recycle Bin + lasso | Icons dropped in the bin are rescued with a per-icon line; lasso + group drag |
| 7 | Run… / command palette | Run dialog, `Ctrl+K` palette, desktop context menu (same resolver as the assistant) |
| 8 | Music player + synced dance | Original-branded media player; assistant dances while it plays |
| 9 | Pixelated webcam | "Retro Cam": local-only processing, palettes, no upload |
| 10 | Paint + easter egg | "DouglasOS Paint" + "DON'T OPEN THIS.exe" (short, reversible) |

Later / future ideas: Solitaire and other games, screen saver (not shipped in stage 1), per-app window menu/status bars, hand-tuned 16px icon variants, heavy 3D scene (v2).

### Definition of done — every v1.5 stage

A stage is done only when **all** of these hold:

- [ ] **Golden rule:** CV and Contact still reachable in ≤ 2 clicks; nothing new covers, delays or gates them.
- [ ] **Accessibility:** keyboard-complete, visible focus, correct roles/labels, AA contrast, screen-reader check of the new UI.
- [ ] **Reduced motion:** every animation has a static alternative; verified with `prefers-reduced-motion: reduce`.
- [ ] **Mobile:** behavior on touch (< 768px) defined in `DESKTOP-INTERFACE-SPEC.md` and implemented (stage 1 only needs to keep the existing mobile path compiling).
- [ ] **EN/PT:** all new UI copy in `messages/en.json` and `messages/pt.json`; no hardcoded strings.
- [ ] **Tests:** Vitest for new pure logic (`lib/`) and stores; component tests for new UI; Playwright e2e for the stage's main flow (resilient selectors).
- [ ] **Brand safety:** no Microsoft names/logos/assets/sounds/verbatim text; no copy or visuals from the reference portfolio.
- [ ] **Green pipeline:** `npm run lint`, `npm run test`, `npm run build`, relevant e2e.
- [ ] **Docs:** `DESKTOP-INTERFACE-SPEC.md` updated (and this file if status changes); entry in `AI-WORKFLOW-LOG.md`.

### Status

| Stage | Status |
|-------|--------|
| 0 | Done |
| 1 | Done — desktop XP shell (≥ 768px) |
| 2 | Done — touchable XP below 768px replaces the linear `MobileFallback` (same shell, stores and content; full-screen windows, row-first icon grid, 85% Start panel, 1s boot); server-rendered crawlable text version; Lighthouse mobile 98–99, LCP ≤ 2.3s. Default wallpaper reworked to "Morning Waves" (abstract, not Bliss-like) |
| 3 | Done — external shortcuts (`linkedin`, `github`, `whatsapp`, `email`) as `kind: "link"` launchers: own column on the desktop, own row on mobile (CV/Contact keep the first row), listed in All Programs; new tab with `noopener noreferrer`, e-mail via `mailto:` |
| 4 | Done — `projects` is **DouglasOS Explorer**: typed case-study source (`lib/content/projects.ts` + EN/PT texts, pending sections shown as "coming soon", no invented content), address bar `C:\DouglasOS\Projects\<slug>` resolving slugs/names/aliases, themed not-found dialog, Back/Forward/Home, File + Favorites menus, route + history in `windowStore` (`openWindow("projects", { route })`), Start → My Projects ▸ submenu; compact one-row toolbar on mobile. No per-project desktop icons |
| 5 | Done — scripted **mini Douglas** assistant: original SVG placeholder character behind the recorded-clip contract (`ASSISTANT-ASSETS.md`, clips pending from Douglas), XP balloon with shortcuts (project, Contact, CV, another tip, not now) and an offline EN/PT intent search (`lib/assistant/intents.ts`, reusable by 5b/7), dance on click, three once-per-session triggers (logon, first Explorer opening, 30s idle), single balloon slot shared with the welcome balloon, steps aside for the focused window's title bar, dismiss for the session; bottom sheet on phones; lazy-loaded |
| 5b | Done — **DouglasOS Messenger**: window app (desktop icon, All Programs, tray "online" icon with unread dot) with a contact list and a scripted conversation; free text through the shared intent matcher, quick replies, "Douglas is typing…" pacing, own SVG emoticons, rate-limited nudge (window shake, static under reduced motion), permanent "automatic replies" notice; **real message** via pre-filled `mailto:` / `wa.me` links built from `lib/profile.ts` (no backend); once-per-session tray toast through the balloon slot; history in sessionStorage; full-screen on phones with chips and a keyboard-aware composer. Personal copy left as `TODO(douglas)` |
| 6 | Done — **Recycle Bin that gives everything back**: own wire-basket icon on the top-right cell by default, draggable on its own and remembered (6b follow-up; it was first pinned bottom-right, under mini Douglas's bubble), never lassoed/grouped/deleted, always-empty window; dropping an icon (or a lassoed group) on it — or `Delete`, or right-click / long-press → Delete — plays a shrink-into-the-bin-and-back animation (static under reduced motion) and mini Douglas says an original EN/PT line per icon (2–3 rotating variations, generic fallback, "cleanup" line for batches that offers the CV first when the CV was in it). If he was dismissed, the bin's own balloon carries the line instead. Lasso + Ctrl/Cmd+click + Ctrl+A multi-select, group drag keeping offsets, Space/Ctrl+Space/Esc/Delete on the keyboard, minimal Open/Delete icon context menu that stage 7 extends; no lasso/drag on phones, bin on its own last row |
| 7 | Done — **Run… + command palette + desktop context menus**: one pure resolver (`lib/run/resolver.ts`) shared by both — registry launchers by id/title/alias (data-driven, so new apps appear on registration), projects through the Explorer address resolver, free text through the assistant's intent matcher, `cmd` easter egg, themed "DouglasOS couldn't find" error; XP Run dialog with an accessible combobox (Start → Run…, `Alt+Shift+R`, `Meta+R` off Apple), `Ctrl/Cmd+K` palette (own listbox, no cmdk), both lazy-loaded; desktop background menu (Arrange Icons, Refresh blink, New ▸ joke, Properties → Display Properties) and icon menu + Properties box; `Shift+F10` / ContextMenu key; long-press on phones (no Arrange there) |
| 8 | Done — **DouglasOS Media Player**: original Luna-style skin around a visible YouTube IFrame player (third-party playlist id in one constant, `lib/media/source.ts`; nocookie host; API script loaded only when the window opens; window not restored after a reload) behind a swappable source adapter; now-playing display with YouTube's title, decorative deterministic visualizer (~30fps, static under reduced motion), transport + volume/mute (persisted), unembeddable videos skipped with a status line and an "Open on YouTube" error dialog when nothing plays; minimizing pauses (YouTube's terms require a visible player); tray volume + now-playing note; Media Session where supported; mini Douglas dances while it plays and says "Phew!… want to see a project?" when it stops. Start → All Programs → **Entertainment** (new generic folder support), no desktop icon; full-screen on phones (background playback stops on screen lock — YouTube limitation) |
| 9 | Done — **Retro Cam** (`camera`): Start → All Programs → Accessories ▸ only (no desktop icon); camera only on an explicit click, video-only, tracks stopped on Turn off / close / minimize / hidden window on phones / hidden tab / device ended; pure pipeline in `lib/camera/` (block average → nearest palette color → pixelated upscale), palettes DouglasOS (Luna tokens, test-synced with `globals.css`), 16 colors, CGA style, Original; Fine/Medium/Large pixels, Mirror (default on), optional frame, Save photo as `douglasos-cam-<timestamp>.png`; status bar with measured FPS (24 FPS cap, steady 24 in Chromium's fake camera) and "local processing · no upload"; XP dialogs for denied/unsupported; full-screen on phones with a smaller capture. No storage key, no frame ever leaves the page |
| 10 | Planned |

---

## Golden Rule

When in doubt about whether something belongs in the MVP, ask:

> "Can a recruiter download my CV and contact me in under 60 seconds without this feature?"

If yes → it doesn't belong in the MVP.
