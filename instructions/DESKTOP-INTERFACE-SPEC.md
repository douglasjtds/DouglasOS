# DouglasOS — Desktop Interface Specification

> Structural specification for the main interface of DouglasOS. This is **not** a landing page in the traditional sense — the interface itself is the experience. This document defines the structure, layout, and behavior of each interface element.

---

## Foundational Principles

1. **Recruiter-first**: Every element serves the goal of helping a recruiter get to CV/contact within 60 seconds
2. **Metaphor with restraint**: The OS metaphor enhances, never blocks
3. **Performance is a feature**: Visual ambition must not degrade core experience
4. **Mobile gets simplicity, not metaphor**: Linear fallback is intentional, not a degraded version

---

## Interface Anatomy (Desktop)

```
┌───────────────────────────────────────────────────────────────┐
│  [MENU BAR]  DouglasOS  |  Active App  |  EN/PT  |  Clock     │  ← Top bar
├───────────────────────────────────────────────────────────────┤
│                                                                │
│    [icon]        [icon]                                        │
│   about.app   experience.app                                   │
│                                                                │
│                                                                │
│    [icon]        [icon]        [icon]                          │  ← Desktop
│  projects.app skills.app  how-i-work-with-ai.app               │   (with 3D ambient
│                                                                │    background)
│                                                                │
│    [icon]        [icon]                                        │
│   resume.pdf   contact.app                                     │
│                                                                │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│            [icon] [icon] [icon] [icon] [icon] [icon] [icon]   │  ← Dock
└───────────────────────────────────────────────────────────────┘
```

---

## Sections in Detail

### 1. BOOT SCREEN

**Purpose:** Set the brand tone and mask initial asset loading.

**Elements:**
- DouglasOS wordmark/logo (centered)
- Subtle loading indicator below (animated)
- Skip button (appears after 1s)
- Background: solid dark or with subtle particle ambient

**Behavior:**
- Duration: 2-3 seconds (skippable after 1s)
- Plays only on first visit per session (sessionStorage flag)
- Smoothly fades into desktop reveal
- Respects `prefers-reduced-motion` (skips entirely)

**Visual guidelines:**
- Logo: large, centered, with subtle glow on accent color
- Loading indicator: minimalist (a thin progress bar or pulsing dot)
- Transition out: fade + slight scale (300-400ms)

---

### 2. MENU BAR (top)

**Purpose:** Persistent system identity and global controls.

**Elements (left → right):**
- DouglasOS logo (small, with subtle glow)
- Active app name (changes as window focus changes)
- Spacer (flex)
- Language toggle (EN / PT pill)
- Clock (live, updates every minute)

**Behavior:**
- Always sticky at top
- Translucent background with backdrop blur (glassmorphism)
- Logo click: closes all windows, returns to clean desktop
- Active app name: shows nothing if no window is focused
- Language toggle: instant swap; persists in localStorage; URL updates to `/en` or `/pt`

**Layout guidelines:**
- Height: 32-36px
- Padding: 16px horizontal
- Font: small (12-13px), monospace for the clock if desired

---

### 3. DESKTOP (main area)

**Purpose:** Surface app icons and provide visual ambiance via 3D background.

**Elements:**
- 3D ambient background (Three.js scene)
- 7 app icons arranged in an organic grid pattern (not strictly aligned)

**3D Background guidelines:**
- Particles or code fragments floating slowly
- Color: subtle cyan/purple glow against dark background
- Low density to avoid distraction
- Lazy-loaded after critical UI renders
- Disabled on mobile and with reduced-motion
- FPS target: 30+ on mid-range hardware

**App Icon guidelines:**
- Size: 80-96px per icon (label included)
- Layout: organic free placement (not rigid grid); responsive scaling
- Each icon has: visual symbol + filename label below
- Hover: subtle scale (1.05) + glow
- Click: opens window with animation from icon position
- Selected state: subtle highlight (could appear on keyboard focus)

**App icon identities:**

| App | Visual Concept |
|-----|----------------|
| `about.app` | Stylized portrait or avatar circle |
| `experience.app` | Briefcase or timeline icon, glowing |
| `projects.app` | Folder or stacked-cards icon |
| `skills.app` | Stack/blocks icon, layered |
| `how-i-work-with-ai.app` | Brain + circuit, or sparkle icon (AI signal) |
| `resume.pdf` | Document icon with PDF badge — visually distinct (looks downloadable) |
| `contact.app` | Speech bubble or address-card icon |

---

### 4. DOCK (bottom)

**Purpose:** Quick access to all apps regardless of desktop state.

**Elements:**
- All 7 app icons in a horizontal row
- Centered or right-anchored (TBD during build)
- Small indicator dot below open apps

**Behavior:**
- Always visible
- Hover effect: icon scales up (1.2-1.3), neighbors scale slightly less (magnification effect, optional)
- Click: opens the app or brings its window to focus if already open
- Translucent background with backdrop blur

**Layout guidelines:**
- Height: 64-80px
- Spacing between icons: 12-16px
- Margin from bottom: 12-16px
- Border radius: 16-20px on the dock container

---

### 5. WINDOWS

**Purpose:** Display app content in a draggable, manageable container.

**Window Chrome (top bar of each window):**
- Three control buttons (left): close, minimize, maximize
  - **Important:** Inspired by macOS but visually distinct — use accent color or custom design, not exact red/yellow/green
- Title (centered or left, after controls)
- Drag handle: entire chrome area

**Window Body:**
- Content area with internal padding
- Scrollable if content exceeds height
- Uses shadcn/ui components for internal UI (buttons, tabs, cards, etc.)

**Window Behaviors:**
- Drag: click and hold chrome → drag anywhere on viewport
- Minimize: hides window, leaves indicator in dock
- Maximize: expands to ~90% viewport (not full)
- Close: removes window from state
- Focus: clicking inactive window brings it to front (z-index management)
- Open animation: 200-300ms ease-out, scale from 0.95 + fade in
- Close animation: 150-200ms ease-in, fade out + slight scale down

**Window Dimensions:**
- Default size: 600x500px (configurable per app)
- Min size: 400x300px
- Max size: viewport minus 40px margin
- Initial position: centered on first open, then slight cascade offset for subsequent opens

**Z-Index Strategy:**
- Base layer: 100
- Each focused window: +1 (capped, recycled on overflow)
- Modals/dialogs inside windows: +1000

---

## App-by-App Content Structure

### `about.app`

**Window size:** ~600x550

**Sections (top → bottom):**
- Profile photo (circular, ~120px)
- Name + headline ("Douglas Tertuliano" + "AI-First Fullstack Developer")
- Location tag
- 2-3 paragraph summary (from CV's profile section, refined)
- Quick-stat row: years of experience, current role, domain focus

---

### `experience.app`

**Window size:** ~700x600

**Layout:** Vertical timeline (or tabbed by role)

**Each role entry:**
- Period (e.g., "2025.09 — Present")
- Company name + logo (if available)
- Role title
- Description (2-3 sentences)
- Tech stack tags (small pills)
- Subtle accent on current role (Serasa Experian)

**Roles in order:**
1. Serasa Experian — Mid-level Fullstack (current, highlighted)
2. ClearSale — Mid-level .NET
3. Zup IT Innovation — Mid-level .NET
4. DTI Digital — Junior .NET
5. Rumo IT Solutions — Junior Developer / Intern

---

### `projects.app`

**Window size:** ~700x600

**Layout:** Grid of project cards (2 columns on desktop)

**Each project card:**
- Screenshot or visual mockup
- Project name
- One-line description
- Tech stack tags
- Links: live demo (if any), GitHub repo
- Status badge: "In progress", "Live", "Coming soon"

**Initial projects:**
- Gasolinha (in progress, link to repo)
- The Wedding Post (in progress, personal/event project)
- Additional projects TBD based on what Douglas wants to showcase

---

### `skills.app`

**Window size:** ~650x550

**Layout:** Categorized lists or tag clouds with visual hierarchy

**Categories:**
- **Backend:** C# / .NET, Node.js
- **Frontend:** React, Next.js, Tailwind CSS, shadcn/ui
- **Databases:** SQL (general), MongoDB
- **Cloud / DevOps:** AWS, Vercel, CI/CD pipelines
- **AI Tooling:** Claude Code, GitHub Copilot, MCP servers
- **Methodology:** Agile, Scrum, API design

**Visual style:** Tags as pills, grouped by category with subtle dividers. Optional skill-level indicator (subtle, no 5-star ratings — avoid amateurish patterns).

---

### `how-i-work-with-ai.app`

**Window size:** ~700x600

**Purpose:** The marquee section. Carries the AI-First positioning.

**Structure:**
- Opening paragraph: stance on AI in development
- Subsections (with examples):
  - **Daily tooling**: Claude Code, Copilot, internal MCPs at work
  - **Discovery-first workflow**: structured PRD/spec process before coding (mention Gasolinha as example)
  - **Productivity multipliers**: where AI accelerates real outcomes
  - **What AI doesn't replace**: judgment, architectural decisions, debugging in production

**Tone:** Confident, specific, evidence-based. Concrete examples > buzzwords.

---

### `resume.pdf` (no window)

**Behavior:**
- Click triggers PDF download
- No window opens
- File: `/public/resume.pdf` (kept current; update process documented in repo README)
- Visual hint: download icon overlay on hover

---

### `contact.app`

**Window size:** ~500x500

**Sections:**
- Header: "Let's talk" or similar (localized)
- Contact cards (clickable):
  - LinkedIn (opens in new tab)
  - GitHub (opens in new tab)
  - Email (mailto + copy-to-clipboard button)
  - WhatsApp (opens WhatsApp web/app)
- Optional: brief availability statement ("Open to remote opportunities", localized)

---

## Mobile Fallback Specification

> When viewport width < 768px, the OS metaphor is replaced with a clean, linear scrolling page using the same content and design tokens.

**Order of sections (top → bottom):**

1. **Hero**
   - Name + profile photo
   - Headline ("AI-First Fullstack Developer")
   - Location
   - Brief tagline

2. **About** (full text from `about.app`)

3. **Experience** (timeline as on desktop, vertical layout)

4. **Featured Projects** (card list, stacked)

5. **Skills** (categorized tags)

6. **How I Work with AI** (the marquee narrative)

7. **Contact** (links, CV download button prominent)

**Mobile-specific elements:**
- Sticky header with language toggle
- "Best on desktop" subtle banner (dismissible)
- CV download as a prominent button in the contact section
- No 3D background (clean dark with subtle gradient)
- No window chrome — content sits in clean cards/sections

---

## Interaction Patterns

### Multi-Window Management
- Multiple windows can be open simultaneously
- Active window has subtle accent border or shadow emphasis
- Click any window to bring to front
- Minimize hides window; dock icon indicates minimized state

### Keyboard Shortcuts (v1)
- `Esc`: Close focused window
- `Tab`: Cycle focus through windows
- `Enter` on focused icon: Open app

### Cursor / Hover Cues
- Default cursor on desktop and chrome
- Pointer cursor on all interactive elements
- Grab cursor on window chrome (drag affordance)
- Subtle visual feedback (scale, glow) on hover

---

## CTA Hierarchy

The interface has a deliberate hierarchy of "calls to action," ordered by importance:

1. **Primary CTA:** Download CV (`resume.pdf` icon)
2. **Secondary CTA:** Contact (`contact.app` icon and dock)
3. **Tertiary CTA:** Explore experience and AI-work app
4. **Quaternary CTA:** Other apps (about, projects, skills)

This hierarchy is reflected through:
- Visual prominence (resume icon slightly more distinctive)
- Dock order (contact and resume positioned for quick reach)
- Mobile fallback (contact + CV download in the most-visible location)

---

## Empty / Edge States

| State | Behavior |
|-------|----------|
| No JavaScript | Mobile fallback content rendered SSR; metaphor unavailable but content readable |
| Slow connection | Boot screen extends; content visible without 3D |
| Reduced motion preference | 3D disabled; window animations minimized |
| Screen reader | Content read in logical order; metaphor unobtrusive |
| Window opened off-screen (rare) | Auto-snap back into viewport |
| 7 windows open at once | All functional; performance maintained |

---

## Build Order Recommendation

For development sequencing:

1. Project setup + design tokens + Tailwind config
2. Boot screen + menu bar (static, layout only)
3. Desktop with icons (no functionality yet)
4. Window manager core (open, close, drag, focus)
5. One app fully functional (`about.app` as proof of concept)
6. Remaining apps content
7. Dock
8. 3D background (lazy-loaded after everything works)
9. i18n setup and translation
10. Mobile fallback
11. SEO + meta tags
12. Polish (animations, micro-interactions)
13. Performance pass
14. QA + accessibility audit
15. Launch
