# DouglasOS

**Date:** March 2026
**Author:** Douglas Tertuliano
**Status:** Building

---

## 💡 Problem

**In one sentence:**
> The current portfolio (`douglasjtds.github.io`) undersells an 8-year fintech/fraud/payments background and doesn't communicate the AI-first developer positioning that's increasingly valued in international remote roles.

**Context:**
Most developer portfolios look identical — a sidebar with avatar, a list of jobs, a list of skills. International tech recruiters scan dozens per day and pattern-match instantly. For a developer with strong fintech experience (ClearSale/Serasa ThreatX, Itaú via Zup, BS2, BNPL/PISP) actively adopting AI tooling (Claude Code, Copilot with internal MCPs), a generic portfolio leaves real differentiation on the table. The goal is to stand out without sacrificing the basics recruiters need (CV, experience, contact).

---

## ✅ Solution

**In one sentence:**
> An interactive portfolio built as a fictional operating system ("DouglasOS") inspired by macOS, with futuristic dark-mode aesthetics, ambient 3D background, and clickable desktop apps that reveal each section of the developer's profile.

**How it works:**
The visitor lands on a boot screen, then sees a desktop with app icons. Each icon opens a draggable window with content (about, experience, projects, skills, how-I-work-with-AI, resume download, contact). The metaphor signals technical confidence and creativity without sacrificing usability — every recruiter need (CV download, contact, experience) is one click away. Mobile users get a clean linear fallback.

---

## 👤 Target Audience

**Primary persona:**
> International tech recruiters and hiring managers sourcing for remote fullstack roles in US/EU companies. They speak English, they scan fast on desktop or mobile, and they value visible AI proficiency in 2026.

**Secondary persona:**
> Brazilian recruiters (via i18n PT toggle) and peer developers who arrive via social media and may amplify the experience.

---

## 🎯 Value Proposition

**Why DouglasOS stands out:**
> A portfolio that proves the developer's positioning before the recruiter reads a single word — the experience itself is the differentiator. "AI-First Fullstack Developer" backed by visible craft, not just claims.

**Current alternatives:**
- Generic Bootstrap-template portfolios (look identical, blend together)
- LinkedIn-only presence (no personal differentiation)
- Static GitHub Pages (functional but forgettable)
- Notion/Read.cv portfolios (clean but not memorable)

**Key differentiators:**
- Interactive OS metaphor with custom branding (DouglasOS, not a macOS clone)
- Ambient 3D background with futuristic code/particle effects
- Dedicated "How I Work with AI" section as core narrative
- Strong fintech/fraud background highlighted prominently
- English-first with Portuguese toggle (international positioning)

---

## 💰 Business Model

**Monetization:**
> Not applicable. This is a personal portfolio. ROI is measured in qualified recruiter contacts and job opportunities.

---

## 📊 Success Metrics

**North Star Metric:**
> Qualified recruiter contacts per month (LinkedIn DMs, emails, or interview invites) attributable to the portfolio.

**Initial goals (3 months post-launch):**
- [ ] 5+ qualified recruiter contacts per month
- [ ] 500+ unique visitors per month
- [ ] 30%+ visitors complete at least 2 app interactions (engagement signal)
- [ ] 10+ CV downloads per month

---

## 🚀 MVP Scope

**What's in (v1 — 3-4 weeks):**
- DouglasOS shell: boot screen, menu bar, dock, desktop icons
- 7 functional apps: about, experience, projects, skills, how-i-work-with-ai, resume.pdf (download), contact
- Window manager: drag, minimize, maximize, close, multi-window
- Light 3D background (React Three Fiber + Drei)
- i18n EN/PT with next-intl (English default)
- Mobile linear fallback
- Deployed on Vercel

**What's NOT in:**
- Functional terminal with commands (v1.5)
- AI Assistant chat (v2 if ever)
- Tic-tac-toe / games (v1.5)
- Easter eggs (v1.5)
- Heavy 3D scene à la bruno-simon (v2)
- Sound effects (v1.5)
- Mobile metaphor adaptation (v2)

---

## 🛠 Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui (customized for dark theme) |
| Animations | Framer Motion |
| 3D | React Three Fiber + Drei |
| State | Zustand (window manager) |
| i18n | next-intl |
| Deploy | Vercel |
| Analytics | Vercel Analytics |

---

## ⏱ Timeline

| Milestone | Timeframe |
|-----------|-----------|
| MVP v1 ready | 3-4 weeks |
| v1.5 (terminal, games, easter eggs) | +2-3 weeks |
| v2 (heavy 3D, AI assistant) | Long-term |

---

## ❓ Hypotheses to Validate

1. [ ] An interactive portfolio generates significantly more recruiter response than a traditional one (measurable via LinkedIn DM volume pre/post launch)
2. [ ] The "AI-First Fullstack" positioning resonates with international remote job opportunities (measurable via the type of roles offered)
3. [ ] Visual ambition doesn't hurt accessibility for recruiters who just need the CV (measurable via CV download rate vs. visits)

---

## 🔗 Links

- Repo: `https://github.com/douglasjtds/DouglasOS`
- Production: TBD (domain decision pending)
- Current portfolio (to be replaced): `https://douglasjtds.github.io/`
- CV reference: `DouglasResume0326_2.pdf`

---

## 📝 Notes

- Visual identity: "DouglasOS" as a custom fictional OS, not a macOS clone — branding belongs to Douglas
- Accent color: cyan electric (`#00D9FF`) for futuristic tech vibe
- The current `douglasjtds.github.io` should be either taken down or redirected once DouglasOS launches, to avoid recruiters finding stale content via Google
- This project runs in parallel with Gasolinha and Wedding Post; pacing matters
