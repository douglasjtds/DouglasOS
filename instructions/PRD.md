# DouglasOS — PRD

**Author:** Douglas Tertuliano
**Date:** March 2026
**Status:** Draft

---

## Overview

DouglasOS is an interactive personal portfolio that presents Douglas Tertuliano's professional profile as a fictional desktop operating system. Visitors interact with clickable app icons that open as draggable windows, each revealing a section of his career, skills, and projects. The goal is to differentiate a developer with 8 years of fintech/fraud/payments experience and active AI tooling adoption in a saturated market of generic developer portfolios.

---

## Problem

### What's happening?
The current portfolio at `douglasjtds.github.io` is a generic Bootstrap-style page that fails to communicate two critical aspects of Douglas's profile:
1. **Strong fintech background** (ClearSale/Serasa ThreatX, Itaú via Zup, BS2, BNPL/PISP, Open Banking)
2. **AI-first developer positioning** (active use of Claude Code, Copilot with internal MCPs)

The site looks indistinguishable from thousands of others, defeating its primary purpose: making recruiters remember Douglas.

### Who's affected?
- Douglas himself: missing opportunities by not standing out
- Recruiters scanning him: can't quickly assess his unique value
- Hiring managers: no signal of creativity, AI proficiency, or production craft

### Cost of not solving?
- Fewer qualified inbound opportunities, especially international remote
- Lower perceived seniority/distinctiveness
- Missing the timing of the "AI-First Developer" hiring trend

### How is it solved today?
- Generic portfolio templates
- LinkedIn as primary online presence
- Resumes sent cold without a memorable companion site

---

## Goals

- [ ] **Goal 1:** Generate measurably more qualified recruiter contacts → Metric: LinkedIn DMs/emails per month (target: 5+/month within 3 months of launch)
- [ ] **Goal 2:** Communicate the "AI-First Fullstack" positioning credibly → Metric: visitors engaging with the `how-i-work-with-ai.app` (target: 40% of sessions)
- [ ] **Goal 3:** Maintain CV accessibility without sacrificing creativity → Metric: CV download rate per visit (target: 10%)
- [ ] **Goal 4:** Be shareable on dev social media (Twitter, Reddit, etc.) → Metric: external referral traffic (target: 20%+ of visits from non-direct sources)

---

## Non-Goals

- ❌ Building a fully simulated operating system (no actual file system, no functional installer)
- ❌ Replicating macOS 1:1 (DouglasOS is its own brand)
- ❌ Mobile-first experience with the OS metaphor (mobile gets a clean linear fallback)
- ❌ Real-time chat with visitors / AI assistant in v1
- ❌ Multi-user features, accounts, or any persistence
- ❌ A blog or CMS-driven content (static content only)
- ❌ Heavy 3D scene like bruno-simon.com (reserved for v2 if ever)

---

## User Stories

### Persona 1: International Tech Recruiter (Primary)

> Sarah, 28, US-based tech recruiter at a Series B startup. Sources 50+ candidates per day. Speaks English. Uses desktop and mobile interchangeably. Wants to know in 60 seconds: "Is this person legit? Can I download their CV? How do I contact them?"

- As an international recruiter, I want to **download Douglas's CV in one click** so I can attach it to my ATS
- As an international recruiter, I want to **see his experience timeline immediately** so I can assess seniority
- As an international recruiter, I want to **find his LinkedIn and email easily** so I can reach out
- As an international recruiter, I want **the site in English by default** so I don't need to translate
- As an international recruiter, I want **the site to load fast on my mobile** so I can review on the go

### Persona 2: Hiring Manager / Tech Lead (Secondary)

> Marco, 35, Engineering Manager at a fintech in Europe. Has 30 minutes to review a shortlist. Wants depth: how does this person think? Can they actually build? Do they understand AI tooling?

- As a hiring manager, I want to **explore Douglas's projects in depth** so I can evaluate technical fit
- As a hiring manager, I want to **understand how he uses AI day-to-day** so I can gauge AI proficiency
- As a hiring manager, I want to **see his fintech experience clearly** so I can assess domain relevance
- As a hiring manager, I want to **read about his stack and tools** so I can match to my team's needs

### Persona 3: Peer Developer (Tertiary)

> Lucas, 26, fullstack dev who found the link on Twitter. Curious about the build. May share if impressed.

- As a peer dev, I want to **discover how the site was built** so I can be inspired
- As a peer dev, I want **the interaction to surprise and delight me** so I share it
- As a peer dev, I want to **see the GitHub repo** so I can star/explore the code

---

## Solution

### High-Level Description

DouglasOS presents a custom-branded desktop interface on landing:
1. A brief **boot sequence** (2-3 seconds) plays as the DouglasOS logo appears
2. The **desktop loads** with a futuristic dark background, ambient 3D effects (floating code, particles), a top menu bar, and a dock at the bottom
3. **App icons** are arranged on the desktop and in the dock
4. Clicking any icon opens a **draggable, minimizable window** with that section's content
5. Multiple windows can be open simultaneously, with proper z-index management
6. A **language toggle** (EN/PT) is accessible from the menu bar
7. **Mobile devices** receive a clean linear fallback with the same content stacked vertically

### Apps in v1 (7 total)

| App | Purpose | Priority |
|-----|---------|----------|
| `about.app` | Introduction, photo, headline, summary | Must have |
| `experience.app` | Career timeline (Serasa → ClearSale → Zup → DTI → Rumo) | Must have |
| `projects.app` | Featured projects (Gasolinha, Wedding Post, others) | Must have |
| `skills.app` | Tech stack visually organized | Must have |
| `how-i-work-with-ai.app` | Narrative on AI tooling usage (Claude Code, Copilot, MCPs) | Must have |
| `resume.pdf` | Direct PDF download (no window — triggers download) | Must have |
| `contact.app` | LinkedIn, GitHub, email, WhatsApp links | Must have |

### User Flow (Desktop)

1. Visitor lands on URL
2. Boot screen plays (2-3s with DouglasOS logo)
3. Desktop reveals with apps and 3D ambient background
4. Visitor clicks an icon (e.g., `about.app`)
5. Window opens with smooth animation, content visible
6. Visitor can drag window, minimize to dock, close, or open more
7. At any moment: toggle EN/PT, download CV via icon, click contact links

### User Flow (Mobile)

1. Visitor lands on URL
2. Brief loading state
3. Linear page reveals sections in this order:
   - Hero (name, headline, photo)
   - About summary
   - Experience timeline
   - Featured projects
   - Skills
   - How I work with AI
   - Contact + CV download
4. Subtle indicator: "Best viewed on desktop for the full experience"

---

## Technical Approach

### Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (customized dark tokens)
- **Animations:** Framer Motion
- **3D:** React Three Fiber + Drei + Three.js
- **State Management:** Zustand (window state, locale)
- **i18n:** next-intl
- **Deploy:** Vercel
- **Analytics:** Vercel Analytics + Vercel Speed Insights

### Architecture

```
[Visitor Browser]
       ↓
[Next.js App Router (Vercel Edge)]
       ↓
   ┌───────────────────────────────────┐
   │ Static content (markdown/MDX)     │
   │ Translations (en.json, pt.json)   │
   │ Public assets (CV PDF, images)    │
   └───────────────────────────────────┘
       ↓
[Client-side rendering]
   - Window manager (Zustand)
   - 3D scene (R3F)
   - Animations (Framer Motion)
```

### Key Modules

- `lib/window-manager/` — Zustand store + hooks for window state (open, close, focus, drag, minimize)
- `components/os/` — OS-level UI (BootScreen, MenuBar, Dock, Desktop, Window)
- `components/apps/` — One folder per app with its own content
- `components/3d/` — R3F scene + ambient effects
- `messages/en.json`, `messages/pt.json` — i18n strings
- `content/` — MDX or TS files with app content (experience, projects, etc.)

### Integrations
- [ ] CV PDF static file (`/public/resume.pdf`)
- [ ] External links: LinkedIn, GitHub, email (mailto), WhatsApp
- [ ] Vercel Analytics for tracking
- [ ] (Optional) Plausible or Umami as privacy-friendly alternative

### Constraints
- Client-side first; minimal server logic (no API routes in v1 except possibly i18n)
- All content static (no CMS)
- No authentication, no user data, no PII
- Bundle target: < 500KB JS on critical path; 3D scene lazy-loaded
- Must work without JavaScript on mobile fallback (SSR'd content)

---

## Non-Functional Requirements

### Performance
- LCP (Largest Contentful Paint) < 3s on 4G
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- Lighthouse Performance ≥ 80 on desktop, ≥ 70 on mobile
- 3D scene must be lazy-loaded after critical content

### Accessibility
- Keyboard navigation: Tab through apps, Enter to open, Esc to close window
- ARIA labels on all interactive elements
- Reduced-motion support (respect `prefers-reduced-motion`)
- Color contrast meets WCAG AA on text
- Mobile fallback is fully accessible (no metaphor barrier)

### SEO
- Proper `<title>` and meta description per locale
- Open Graph image (DouglasOS desktop screenshot)
- Twitter card meta tags
- Structured data: `Person` schema with `jobTitle`, `worksFor`, etc.
- `sitemap.xml` and `robots.txt`
- Mobile fallback content is SSR'd for crawlers

### Security
- No user input fields (no XSS surface)
- No backend (no auth or data leak risk)
- Strict CSP headers via `next.config.js`
- Resume PDF served from same origin (no third-party CDN risk)

### Internationalization
- Default: English (`en`)
- Secondary: Portuguese (`pt`)
- URL pattern: `/en/...` and `/pt/...` (next-intl convention)
- Language preference persisted in localStorage
- Toggle visible in menu bar

### Browser Support
- Modern evergreen browsers (last 2 versions of Chrome, Firefox, Safari, Edge)
- Safari iOS 16+ for mobile fallback
- Graceful degradation for older browsers (mobile fallback rendered)

---

## Edge Cases

| Case | Behavior |
|------|----------|
| User on slow 3G | Boot screen shows skeleton until 3D loads; content visible without 3D |
| User with `prefers-reduced-motion` | 3D scene disabled, window animations minimized |
| User without JavaScript | Mobile fallback content rendered via SSR; OS metaphor unavailable |
| User opens all 7 windows at once | Z-index manager works; performance maintained; visual hint that focus shifts |
| User on very small mobile (<320px) | Linear fallback adapts; no horizontal scroll |
| User on very large monitor (>4K) | Desktop scales; 3D background fills viewport |
| User clicks `resume.pdf` | Triggers download (browser handles); no window opens |
| User switches language with windows open | Content inside windows re-renders in new locale; window positions preserved |
| Screen reader user | Reads structured content in logical order regardless of visual layout |

---

## Success Metrics

| Metric | Baseline | Target (3 months) | How to measure |
|--------|----------|-------------------|----------------|
| Monthly unique visitors | 0 | 500+ | Vercel Analytics |
| Recruiter contacts/month | ~1 | 5+ | LinkedIn + email tracked manually |
| CV downloads/month | 0 | 50+ | Vercel Analytics event on PDF click |
| Multi-app engagement | N/A | 30%+ sessions | Custom event: 2+ window opens |
| Mobile vs Desktop split | N/A | 40/60 | Vercel Analytics |
| Bounce rate | N/A | < 60% | Vercel Analytics |

---

## Timeline

| Phase | Description | Duration | Deliverables |
|-------|-------------|----------|--------------|
| Setup | Repo, Next.js scaffold, Vercel, base tokens | 2-3 days | Skeleton project live |
| OS Shell | Boot, menu bar, dock, window manager | 5-7 days | Empty windows work |
| Apps Content | All 7 apps with real content | 5-7 days | Full content visible |
| 3D Background | R3F scene with particles/code effect | 2-3 days | Background integrated |
| i18n | EN/PT setup with all strings | 2 days | Language toggle works |
| Mobile Fallback | Linear responsive version | 2-3 days | Mobile experience polished |
| Polish & QA | Performance, accessibility, browser testing | 3-4 days | Production-ready |
| Launch | Deploy, social posts, LinkedIn update | 1 day | Live and shared |
| **Total** | | **~3-4 weeks** | |

---

## Risks & Assumptions

### Assumptions
- A more memorable portfolio meaningfully increases recruiter response (validated post-launch via DM volume)
- Recruiters tolerate / appreciate creativity if usability is preserved
- Three.js / R3F can be learned during the build with AI assistance
- Vercel free tier covers expected traffic

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep into "v2 features" | High | High | Strict MVP definition; defer terminal/AI/games |
| 3D performance hurts Lighthouse | Medium | Medium | Lazy load 3D; static fallback; LOD techniques |
| Learning curve on R3F | Medium | Medium | Use AI assistance (Claude Code); start with simple particles |
| Mobile experience feels degraded | Medium | Medium | Make linear fallback genuinely polished, not afterthought |
| Recruiter doesn't realize CV is downloadable | Low | High | Distinct icon for resume.pdf with download cue + redundant link in contact.app |
| Old `douglasjtds.github.io` ranks above new site | Medium | Medium | Take down old site or set canonical link to new domain |

---

## Open Questions

- [ ] Domain choice: `douglastertuliano.dev`, `douglasjtds.dev`, or stick with `.com.br`?
- [ ] Should there be a "splash" or "loading" message users can skip? (UX trade-off)
- [ ] Are the 7 apps locked, or can we replace one with a different idea before build starts?
- [ ] Should `projects.app` link out to live demos or stay self-contained?
- [ ] Light mode toggle in v1, or dark-only?

---

## Appendix

### References
- bruno-simon.com — interactive 3D portfolio (ambition reference)
- linear.app — design density and quality reference
- vercel.com — gradients and code aesthetic
- arc.net — visual boldness
- macOS Sonoma — window chrome and dock inspiration

### Source Materials
- `DouglasResume0326_2.pdf` — primary source for experience/skills content
- `douglasjtds.github.io` — current portfolio (to be replaced)
- LinkedIn: `https://www.linkedin.com/in/douglasjtds/`
- GitHub: `https://github.com/douglasjtds`
