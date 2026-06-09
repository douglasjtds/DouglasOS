# DouglasOS — MVP Scope

**Date:** March 2026
**Version:** 1.0

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
| Menu bar (top) | DouglasOS logo, active app name, clock, EN/PT toggle | Visible always, sticky, functional toggle |
| Dock (bottom) | Hover-effected shortcuts to all 7 apps | Icons scale on hover, opens app on click, indicator for open apps |
| Desktop icons | 7 app icons arranged on desktop | Click opens window, double-click also works, visual focus state |
| Window manager | Drag, minimize, maximize, close, focus | Multiple windows work simultaneously, z-index correct, smooth animations |
| `about.app` | Photo, name, headline, summary paragraph | Content matches CV; localized |
| `experience.app` | Career timeline with all roles | All 6 roles (Serasa → Rumo) visible; Serasa highlighted; localized |
| `projects.app` | Featured projects (Gasolinha, Wedding Post, optional others) | 2-3 projects with screenshots/descriptions; links to live or repo |
| `skills.app` | Tech stack visually organized | Grouped by category (Backend, Frontend, Databases, Cloud, AI tools) |
| `how-i-work-with-ai.app` | Narrative on AI-first approach | Concrete examples (Claude Code at Serasa, MCP usage, discovery process); localized |
| `resume.pdf` icon | Triggers PDF download on click | Click → download starts; no window opens; uses up-to-date PDF |
| `contact.app` | Links to LinkedIn, GitHub, email, WhatsApp | All links work; copy-to-clipboard for email; localized labels |
| 3D background (light) | Ambient floating code/particles via R3F | Renders smoothly, doesn't block interaction, respects reduced-motion |
| i18n EN/PT | All UI and content translated | Toggle switches instantly; URL reflects locale (`/en`, `/pt`); EN is default |
| Mobile fallback | Linear scroll version of same content | Fully responsive on phones; no OS metaphor; clean and polished |
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
| Light mode toggle | Switch between dark and light themes | Multiple recruiters mention dark mode aversion |
| Wallpaper picker | User picks desktop background | Adds personality; if v1 gets traction |
| App icons with notification dots | Indicate "new" content | If portfolio is regularly updated |

---

## Scope: What's OUT

### Explicitly Out of MVP

| Feature | Why not included | When to reconsider |
|---------|------------------|---------------------|
| Functional terminal with commands | High complexity (parser, command logic, history) | v1.5 after core launches |
| Tic-tac-toe / games | Polish feature, not core differentiator | v1.5 |
| Easter eggs | Discoverability is wasted if base experience isn't solid | v1.5 |
| AI Assistant chat | Token cost, abuse risk, infrastructure needs | v2 if ever; needs rate-limiting infra |
| Heavy 3D scene (bruno-simon style) | Massive scope; learning curve; performance risk | v2 after validation |
| Sound effects (boot, click) | Most recruiters browse with sound off | v1.5 with mute toggle |
| Mobile OS metaphor adaptation | Doubles design/dev work | v2 after desktop is solid |
| Blog or articles section | Content production overhead | If content strategy emerges later |
| Project case studies (deep) | Long-form requires time investment | Post-launch, one at a time |
| Custom file system simulation | Adds zero value to core goal | Never (or v3 if portfolio becomes a product itself) |
| Real-time multiplayer / shared sessions | Out of scope of a portfolio | Never |
| Backend / database | Content is static | Never for this project |

### Common Temptations to Avoid

- [ ] Building "just one more app" before launch
- [ ] Pixel-perfect macOS replication (DouglasOS is its own thing)
- [ ] Overly long boot sequence "for cinematics"
- [ ] Complex preferences/settings panel
- [ ] Multiple themes/skins
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
- [x] **Dark mode only in v1** (light mode could come later if requested)
- [x] **Desktop-first metaphor**, mobile gets linear fallback
- [x] **shadcn/ui default + dark customization** — no full design system from scratch
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
| Recruiter who only browses on mobile | Served by linear fallback, not optimized for metaphor experience |
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

### Flow 3: Mobile visitor (fallback)

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
| Framework | Next.js 14+ App Router | SSR for SEO, modern DX, Vercel-native |
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
- [ ] Form libraries (no forms)
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

## Post-MVP Roadmap

After validating MVP, consider in this order:

1. [ ] **v1.5 features:** terminal, easter eggs, game
2. [ ] **Content additions:** deeper project case studies, blog/notes section
3. [ ] **Polish:** light mode toggle, sound effects (with mute)
4. [ ] **v2 ambitions:** heavy 3D scene, AI assistant (with rate limiting), mobile metaphor adaptation

---

## Golden Rule

When in doubt about whether something belongs in the MVP, ask:

> "Can a recruiter download my CV and contact me in under 60 seconds without this feature?"

If yes → it doesn't belong in the MVP.
