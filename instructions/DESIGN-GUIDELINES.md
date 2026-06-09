# DouglasOS — Design Guidelines

> Visual design system for DouglasOS. These tokens and rules are the source of truth for all UI work. Implement them as Tailwind config + CSS variables for consistency.

---

## Design Philosophy

**DouglasOS visual identity:** dark, futuristic, confident. Inspired by macOS chrome conventions but with its own brand — never a clone. Glassmorphism, electric accents, ambient depth. The interface should feel like premium software, not a toy.

**Core tensions to balance:**
- Visual ambition vs. recruiter-readability
- Originality vs. familiar UI patterns
- Density vs. breathing room
- Tech aesthetics vs. accessibility

---

## Color Palette

### Base / Neutrals (Dark Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `base-0` | `#0A0A0F` | Deepest background (under 3D scene) |
| `base-1` | `#13131A` | Solid surfaces, mobile fallback bg |
| `base-2` | `#1C1C26` | Slightly elevated surfaces |
| `base-3` | `#2A2A36` | Window borders, dividers |
| `base-4` | `#3D3D4A` | Subtle highlights, hover states |

### Surfaces (Glassmorphism)

| Token | Value | Usage |
|-------|-------|-------|
| `glass-window` | `rgba(20, 20, 30, 0.65)` + `backdrop-blur(20px)` | Main window backgrounds |
| `glass-chrome` | `rgba(15, 15, 22, 0.75)` + `backdrop-blur(24px)` | Menu bar, dock, window chrome |
| `glass-card` | `rgba(28, 28, 38, 0.5)` + `backdrop-blur(12px)` | Cards inside windows |

### Accent (Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#00D9FF` | Primary accent — buttons, focus, glow, key highlights |
| `accent-bright` | `#33E1FF` | Hover state of accent |
| `accent-muted` | `#0099B8` | Subdued accent (e.g., secondary text on accent bg) |
| `accent-glow` | `rgba(0, 217, 255, 0.4)` | Glow effects, shadows |

### Accent (Secondary — sparing use)

| Token | Hex | Usage |
|-------|-----|-------|
| `accent-purple` | `#7C3AED` | Optional secondary accent for variety (e.g., AI-related elements) |
| `accent-purple-glow` | `rgba(124, 58, 237, 0.4)` | Purple glow effects |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#F5F5F7` | Headings, primary content |
| `text-secondary` | `#C7C7CC` | Body text |
| `text-muted` | `#8A8A93` | Captions, hints, timestamps |
| `text-disabled` | `#5A5A63` | Disabled state |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#22C55E` | Success indicators (current role badge, etc.) |
| `warning` | `#F59E0B` | Warnings (rare in this UI) |
| `danger` | `#EF4444` | Close window button (subtle, not classic macOS red) |

### Window Control Buttons

> Inspired by macOS but visually distinct. Don't copy the exact red-yellow-green sequence.

| Action | Color | Hover |
|--------|-------|-------|
| Close | `#FF5F57` (muted) | `#FF7B73` |
| Minimize | `#FFBD2E` (muted) | `#FFCC4D` |
| Maximize | `#28C840` (muted) | `#3FD651` |

**Note:** Keep these at lower saturation than macOS for distinction. Consider monochrome versions on hover for further differentiation.

---

## Typography

### Font Families

| Token | Stack | Usage |
|-------|-------|-------|
| `font-sans` | `'Geist Sans', Inter, system-ui, sans-serif` | UI default |
| `font-mono` | `'Geist Mono', 'JetBrains Mono', ui-monospace, monospace` | Code blocks, terminal-style text, clock |
| `font-display` | `'Geist Sans', Inter, sans-serif` (weight 600+) | Headings, app titles |

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px | 16px | 400/500 | Captions, clock, hints |
| `text-sm` | 14px | 20px | 400 | Secondary body, labels |
| `text-base` | 16px | 24px | 400 | Body text |
| `text-lg` | 18px | 26px | 500 | Large body, subtitles |
| `text-xl` | 20px | 28px | 600 | Section headings (small) |
| `text-2xl` | 24px | 32px | 600 | Section headings (large) |
| `text-3xl` | 30px | 38px | 700 | Page headings (e.g., app titles inside windows) |
| `text-4xl` | 36px | 44px | 700 | Hero name, marquee text |
| `text-5xl` | 48px | 56px | 700 | Boot screen logo |

### Typography Rules

- **Headings:** Geist Sans, weight 600-700, tight tracking (-0.02em on 24px+)
- **Body:** Geist Sans, weight 400, normal tracking
- **Mono:** Geist Mono for any code-like or technical text
- **Avoid:** decorative fonts, font weights below 400
- **App titles in window chrome:** Geist Sans 500, 14px
- **Filename labels (under desktop icons):** Geist Mono 500, 12px

---

## Spacing Scale

Based on a **4px base unit** (Tailwind default).

| Token | Value | Common Use |
|-------|-------|------------|
| `space-0` | 0 | Reset |
| `space-1` | 4px | Tight gaps, icon padding |
| `space-2` | 8px | Small gaps between related elements |
| `space-3` | 12px | Padding inside small buttons |
| `space-4` | 16px | Standard padding, gap between cards |
| `space-5` | 20px | Window chrome padding |
| `space-6` | 24px | Window content padding |
| `space-8` | 32px | Section spacing |
| `space-10` | 40px | Large section gaps |
| `space-12` | 48px | Major divisions |
| `space-16` | 64px | Hero spacing (mobile) |

**Rules:**
- Don't use values between scale steps
- Don't invent custom values for "just this case"
- Vertical rhythm: prefer multiples of `space-2` (8px) for paragraph spacing

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Small badges, tags |
| `radius-md` | 8px | Buttons, inputs, cards inside windows |
| `radius-lg` | 12px | Windows, large cards |
| `radius-xl` | 16px | Dock container |
| `radius-2xl` | 20px | Hero containers (mobile) |
| `radius-full` | 9999px | Pills, avatar circles, accent toggle |

---

## Shadows & Glows

### Box Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-window` | `0 25px 50px -12px rgba(0, 0, 0, 0.6)` | Active windows (dramatic depth) |
| `shadow-window-inactive` | `0 15px 30px -8px rgba(0, 0, 0, 0.4)` | Inactive windows |
| `shadow-dock` | `0 10px 30px -8px rgba(0, 0, 0, 0.5)` | Dock container |
| `shadow-card` | `0 4px 12px rgba(0, 0, 0, 0.3)` | Cards inside windows |
| `shadow-glow-accent` | `0 0 24px rgba(0, 217, 255, 0.4)` | Glow on accent elements |
| `shadow-glow-subtle` | `0 0 16px rgba(0, 217, 255, 0.2)` | Subtle accent glow (hover states) |

### Glow Strategy
- Use glows **sparingly** on hover and focus states, not as decoration
- Accent glow on: focused window borders, hover state of dock icons, CTA buttons
- Avoid glow on body text or large surfaces (looks tacky)

---

## Glassmorphism Recipe

Apply consistently across all "glass" surfaces (windows, menu bar, dock):

```css
background: rgba(20, 20, 30, 0.65);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.08);
```

**Variations:**
- Menu bar: blur 24px, slightly more opaque
- Window: blur 20px, standard
- Dock: blur 24px, slightly more opaque
- Cards inside windows: blur 12px, lighter

**Fallback:** Browsers without `backdrop-filter` (rare in modern set) get a solid `base-2` background.

---

## Animations & Transitions

### Library: Framer Motion

### Standard Durations

| Token | Value | Use |
|-------|-------|-----|
| `duration-fast` | 150ms | Micro-interactions (button press) |
| `duration-base` | 250ms | Hover effects, small state changes |
| `duration-medium` | 350ms | Window open/close, app launches |
| `duration-slow` | 500ms | Boot screen transitions |

### Easing

| Token | Curve | Use |
|-------|-------|-----|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for entries (windows opening) |
| `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Exits (windows closing) |
| `ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Bidirectional (drag, smooth movement) |
| `ease-bounce` | `spring(stiffness: 200, damping: 20)` | Playful elements (dock hover) |

### Animation Recipes

**Window Open:**
```ts
{
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
}
```

**Dock Icon Hover (magnification):**
```ts
{
  whileHover: { scale: 1.2, y: -4 },
  transition: { type: "spring", stiffness: 300, damping: 20 }
}
```

**Boot Screen Out:**
```ts
{
  exit: { opacity: 0, scale: 1.05 },
  transition: { duration: 0.5, ease: [0.7, 0, 0.84, 0] }
}
```

### Reduced Motion

Respect `prefers-reduced-motion: reduce`:
- Disable 3D scene entirely
- Replace window animations with simple opacity transitions
- Disable dock magnification
- Disable boot screen animation (skip directly to desktop)

---

## Iconography

### Style
- Outline style with 1.5-2px stroke
- Rounded line caps
- Subtle accent fills on key UI elements
- Consistent visual weight across all icons

### Library Choice
- **Primary:** `lucide-react` (consistent, comprehensive, well-maintained)
- **Custom:** App icons may be custom-designed for brand identity

### App Icon Visual Treatment
- Container: gradient background (subtle, dark) with rounded corners (radius-md or radius-lg)
- Symbol: clean lucide icon in accent or white
- Label below: Geist Mono 12px
- Hover: subtle glow + scale (1.05)

---

## Component Guidelines (shadcn/ui usage)

Use shadcn/ui components for in-window UI, customized to match the dark glass aesthetic.

### Buttons

| Variant | When to use |
|---------|-------------|
| `default` (accent bg) | Primary CTA inside an app (e.g., "Download CV") |
| `outline` | Secondary actions |
| `ghost` | Tertiary, navigation-style actions |
| `link` | Inline text actions |

**Customization:**
- Primary buttons: accent bg + dark text, glow on hover
- All buttons: radius-md, 14px font, slight scale on click

### Tabs

Use for switching content within a single window (e.g., projects organized by category).
- Underline indicator in accent color
- Smooth transition between tab content

### Cards

For projects, experience items, and content groupings inside windows.
- Background: `glass-card`
- Border: `1px solid base-3`
- Hover: subtle accent border + slight lift

### Badges / Tags

For tech stack tags, status indicators.
- Background: `base-3` with `accent` text, or filled accent for emphasis
- Small text (12px), pill shape (`radius-full`)
- No icon unless meaningful

### Dialogs / Modals

Avoid in v1. Window system replaces modal patterns.

### Tooltips

Use sparingly — small accent-styled tooltips on icon-only buttons (e.g., window controls).

---

## 3D Scene Guidelines

### Concept
Ambient background with subtle motion. Goal: presence, not distraction.

### Elements
- Floating "code fragments" (text-like geometry) drifting slowly
- Soft particles in accent and purple
- Subtle depth-of-field blur on background elements
- Color palette: dark base + accent cyan + occasional purple

### Implementation
- React Three Fiber + Drei
- Postprocessing pipeline: subtle bloom on accent particles
- Performance: cap at 30 FPS, low density of objects
- Lazy load: 3D scene only initializes after critical UI renders
- Disable on mobile and `prefers-reduced-motion`

### Density Recommendation
- 50-100 floating particles total
- 5-10 code fragments
- No high-poly models
- No physics, no collisions

---

## Visual References

| Reference | What to Borrow |
|-----------|----------------|
| Linear (`linear.app`) | Density, typography quality, transitions |
| Vercel (`vercel.com`) | Gradients, monospace usage, dark mode polish |
| Arc Browser (`arc.net`) | Visual ambition, glass effects |
| macOS Sonoma | Window chrome conventions, dock magnification |
| bruno-simon.com | Ambition reference for 3D (v2 target) |
| Apple Vision Pro UI | Glassmorphism execution at its peak |
| Raycast (`raycast.com`) | Command-style aesthetic for terminal app (v1.5) |
| Phantom Wallet | Dark mode + accent color execution |

---

## Accessibility Notes

- All accent-colored text must meet WCAG AA contrast on its background (`#00D9FF` on `base-1` passes; verify each pairing)
- Focus indicators visible on all interactive elements (accent ring 2px)
- Don't rely on color alone — use icons, text labels, or shape changes
- Reduced motion respected throughout
- Touch targets on mobile: minimum 44x44px
- Window chrome buttons must have ARIA labels

---

## Anti-Patterns (what to avoid)

- ❌ Bright/saturated full backgrounds (this is a dark UI, keep base dark)
- ❌ Multiple competing accent colors in one view (cyan as primary, purple sparingly)
- ❌ Skeuomorphic textures (no fake leather, brushed metal, etc.)
- ❌ Drop shadows on text (looks dated)
- ❌ Gradient text for body content (use only for hero/brand elements)
- ❌ More than one font family per screen (Sans + Mono only when intentional)
- ❌ Overly playful animations (this isn't a kids' app)
- ❌ Loading spinners spinning forever (always have a timeout / fallback)
- ❌ Icons without labels in primary nav
- ❌ macOS button colors at full saturation (looks like a copy)

---

## Tailwind Config Reference

```ts
// tailwind.config.ts (conceptual — adjust to actual structure)
export default {
  theme: {
    extend: {
      colors: {
        base: {
          0: '#0A0A0F',
          1: '#13131A',
          2: '#1C1C26',
          3: '#2A2A36',
          4: '#3D3D4A',
        },
        accent: {
          DEFAULT: '#00D9FF',
          bright: '#33E1FF',
          muted: '#0099B8',
          purple: '#7C3AED',
        },
        text: {
          primary: '#F5F5F7',
          secondary: '#C7C7CC',
          muted: '#8A8A93',
          disabled: '#5A5A63',
        },
      },
      fontFamily: {
        sans: ['Geist Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        window: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        'window-inactive': '0 15px 30px -8px rgba(0, 0, 0, 0.4)',
        dock: '0 10px 30px -8px rgba(0, 0, 0, 0.5)',
        card: '0 4px 12px rgba(0, 0, 0, 0.3)',
        'glow-accent': '0 0 24px rgba(0, 217, 255, 0.4)',
        'glow-subtle': '0 0 16px rgba(0, 217, 255, 0.2)',
      },
      backdropBlur: {
        glass: '20px',
        'glass-strong': '24px',
      },
      borderRadius: {
        window: '12px',
        dock: '16px',
      },
    },
  },
}
```

---

## CSS Variables (alternative / complement)

```css
:root {
  --base-0: #0A0A0F;
  --base-1: #13131A;
  --base-2: #1C1C26;
  --base-3: #2A2A36;
  --base-4: #3D3D4A;

  --accent: #00D9FF;
  --accent-bright: #33E1FF;
  --accent-muted: #0099B8;
  --accent-purple: #7C3AED;

  --text-primary: #F5F5F7;
  --text-secondary: #C7C7CC;
  --text-muted: #8A8A93;
  --text-disabled: #5A5A63;

  --glass-window: rgba(20, 20, 30, 0.65);
  --glass-chrome: rgba(15, 15, 22, 0.75);
  --glass-card: rgba(28, 28, 38, 0.5);

  --shadow-window: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  --shadow-glow-accent: 0 0 24px rgba(0, 217, 255, 0.4);

  --radius-window: 12px;
  --radius-dock: 16px;

  --blur-glass: 20px;
  --blur-glass-strong: 24px;
}
```

---

## Final Checklist Before Coding

- [ ] Tailwind config extended with all tokens above
- [ ] Geist Sans + Geist Mono loaded via `next/font`
- [ ] shadcn/ui installed with dark theme as default
- [ ] CSS variables defined in `globals.css`
- [ ] Base layout uses `base-0` as page background
- [ ] First component (e.g., button) built using design tokens — no hardcoded values
- [ ] Reduced-motion media query handled globally
