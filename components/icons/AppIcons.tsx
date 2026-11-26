/**
 * Original DouglasOS launcher icons in an early-2000s glossy style: soft
 * vertical gradients, light from the top-left, a darker 1px outline and a
 * subtle drop shadow drawn inside the SVG. Never traced from any real OS icon.
 * Each is drawn on a 48px master and scales down to 32/24/16px.
 */
import type { ReactNode } from "react";
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";

export function Svg({
  size = 48,
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      // Fixed-size glyphs: never squeezed by flex rows (menus, task buttons).
      style={{ flexShrink: 0 }}
      aria-hidden
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Soft elliptical ground shadow shared by all icons. */
export function GroundShadow({ cx = 24, cy = 44, rx = 17 }: { cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={2.5} fill={C.shadow} opacity={0.22} />;
}

/** `about` — ID badge with a stylized silhouette. */
export function AboutIcon(props: IconProps) {
  const id = useSvgIds("card", "band", "photo");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.card} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.paper} />
          <stop offset="1" stopColor={C.paperShade} />
        </linearGradient>
        <linearGradient id={id.band} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.blueLight} />
          <stop offset="1" stopColor={C.blue} />
        </linearGradient>
        <linearGradient id={id.photo} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe3ff" />
          <stop offset="1" stopColor="#8fb4ea" />
        </linearGradient>
      </defs>
      <GroundShadow />
      <rect x="5" y="9" width="38" height="32" rx="4" fill={`url(#${id.card})`} stroke={C.outline} strokeWidth="1" />
      <path d="M5.5 13a3.5 3.5 0 0 1 3.5-3.5h30a3.5 3.5 0 0 1 3.5 3.5v3h-37z" fill={`url(#${id.band})`} />
      <rect x="20" y="5" width="8" height="7" rx="2" fill={C.metal} stroke={C.metalDark} strokeWidth="1" />
      <rect x="9" y="19" width="14" height="17" rx="1.5" fill={`url(#${id.photo})`} stroke={C.outline} strokeWidth="0.8" />
      <circle cx="16" cy="25" r="3.6" fill={C.blueDark} />
      <path d="M10 36c0-4.5 2.7-6.5 6-6.5s6 2 6 6.5z" fill={C.blueDark} />
      <rect x="26" y="21" width="13" height="2.2" rx="1.1" fill={C.blue} />
      <rect x="26" y="26" width="11" height="1.8" rx="0.9" fill={C.paperLine} />
      <rect x="26" y="30" width="12" height="1.8" rx="0.9" fill={C.paperLine} />
      <rect x="26" y="34" width="8" height="1.8" rx="0.9" fill={C.paperLine} />
    </Svg>
  );
}

/** `experience` — leather briefcase. */
export function ExperienceIcon(props: IconProps) {
  const id = useSvgIds("body", "flap");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.leatherLight} />
          <stop offset="1" stopColor={C.leather} />
        </linearGradient>
        <linearGradient id={id.flap} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a066" />
          <stop offset="1" stopColor={C.leatherLight} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <path d="M17 14v-3.5a2.5 2.5 0 0 1 2.5-2.5h9a2.5 2.5 0 0 1 2.5 2.5V14h-3v-3h-8v3z" fill={C.leatherDark} />
      <rect x="4" y="14" width="40" height="27" rx="4" fill={`url(#${id.body})`} stroke={C.leatherDark} strokeWidth="1" />
      <path d="M4.5 18a3.5 3.5 0 0 1 3.5-3.5h32a3.5 3.5 0 0 1 3.5 3.5v6c-6 3-13 4-19.5 4S10.5 27 4.5 24z" fill={`url(#${id.flap})`} />
      <path d="M4.5 24c6 3 13 4 19.5 4s13.5-1 19.5-4" fill="none" stroke={C.leatherDark} strokeWidth="1" />
      <rect x="20" y="24.5" width="8" height="6" rx="1.2" fill={C.yellow} stroke={C.yellowDark} strokeWidth="1" />
      <rect x="22.5" y="26.5" width="3" height="2" rx="0.6" fill={C.yellowDark} />
      <path d="M8 17h32" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

/** `projects` — yellow folder with documents peeking out. */
export function ProjectsIcon(props: IconProps) {
  const id = useSvgIds("back", "front");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.back} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c94f" />
          <stop offset="1" stopColor={C.yellowDark} />
        </linearGradient>
        <linearGradient id={id.front} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.yellowLight} />
          <stop offset="1" stopColor={C.yellow} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <path d="M4 12a2 2 0 0 1 2-2h11l3.5 3.5H42a2 2 0 0 1 2 2V40H4z" fill={`url(#${id.back})`} stroke={C.yellowDark} strokeWidth="1" />
      <rect x="10" y="9" width="24" height="22" rx="1" fill={C.paper} stroke={C.paperLine} strokeWidth="0.8" transform="rotate(-6 22 20)" />
      <rect x="15" y="11" width="24" height="22" rx="1" fill={C.paper} stroke={C.paperLine} strokeWidth="0.8" transform="rotate(5 27 22)" />
      <path d="M18 16h15M18 19.5h15M18 23h10" stroke={C.paperLine} strokeWidth="1.2" transform="rotate(5 27 22)" />
      <path d="M3 21a2 2 0 0 1 2-2h38a2 2 0 0 1 2 2.3l-2 18.2a2 2 0 0 1-2 1.5H7a2 2 0 0 1-2-1.5z" fill={`url(#${id.front})`} stroke={C.yellowDark} strokeWidth="1" />
      <path d="M6 22.5h36" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

/** `skills` — red toolbox with a metal latch. */
export function SkillsIcon(props: IconProps) {
  const id = useSvgIds("body", "lid");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.redLight} />
          <stop offset="0.25" stopColor={C.red} />
          <stop offset="1" stopColor={C.redDark} />
        </linearGradient>
        <linearGradient id={id.lid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3a487" />
          <stop offset="1" stopColor={C.red} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <path d="M16 14v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4h-3v-3H19v3z" fill={C.metalDark} />
      <path d="M6 18l3-5h30l3 5z" fill={`url(#${id.lid})`} stroke={C.redDark} strokeWidth="1" strokeLinejoin="round" />
      <rect x="5" y="18" width="38" height="22" rx="2.5" fill={`url(#${id.body})`} stroke={C.redDark} strokeWidth="1" />
      <rect x="5.5" y="22" width="37" height="2.5" fill={C.redDark} opacity="0.55" />
      <rect x="19" y="19.5" width="10" height="7" rx="1.5" fill={C.metalLight} stroke={C.metalDark} strokeWidth="1" />
      <rect x="22.5" y="22" width="3" height="2.5" rx="0.6" fill={C.metalDark} />
      <rect x="9" y="29" width="4" height="7" rx="1" fill={C.yellow} stroke={C.yellowDark} strokeWidth="0.8" />
      <rect x="35" y="29" width="4" height="7" rx="1" fill={C.blueLight} stroke={C.blue} strokeWidth="0.8" />
    </Svg>
  );
}

/** `how-i-work-with-ai` — lightbulb with a circuit spark (the marquee icon). */
export function AiIcon(props: IconProps) {
  const id = useSvgIds("glass", "glow", "base");
  return (
    <Svg {...props}>
      <defs>
        <radialGradient id={id.glass} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#fffbe0" />
          <stop offset="0.55" stopColor="#ffe06a" />
          <stop offset="1" stopColor="#f0a81c" />
        </radialGradient>
        <radialGradient id={id.glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3a6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff3a6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id.base} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.metalDark} />
          <stop offset="0.45" stopColor={C.metalLight} />
          <stop offset="1" stopColor={C.metalDark} />
        </linearGradient>
      </defs>
      <GroundShadow rx={10} />
      <circle cx="24" cy="18" r="17" fill={`url(#${id.glow})`} />
      <path d="M24 4c-7.7 0-13 5.6-13 12.6 0 4.6 2.3 7.5 4.6 10 1.6 1.8 2.4 3.4 2.4 5.4h12c0-2 .8-3.6 2.4-5.4 2.3-2.5 4.6-5.4 4.6-10C37 9.6 31.7 4 24 4z" fill={`url(#${id.glass})`} stroke={C.yellowDark} strokeWidth="1" />
      <path d="M20 31v-8l4-4 4 4v8" fill="none" stroke={C.orange} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="24" cy="19" r="1.8" fill={C.orange} />
      <circle cx="20" cy="23" r="1.2" fill={C.orange} />
      <circle cx="28" cy="23" r="1.2" fill={C.orange} />
      <ellipse cx="19.5" cy="11" rx="3.5" ry="2.2" fill="#ffffff" opacity="0.75" transform="rotate(-30 19.5 11)" />
      <rect x="17.5" y="32" width="13" height="8" rx="2" fill={`url(#${id.base})`} stroke={C.metalDark} strokeWidth="0.8" />
      <path d="M17.5 34.6h13M17.5 37.3h13" stroke={C.metalDark} strokeWidth="0.8" />
      <path d="M21 40h6l-1 2.5h-4z" fill={C.metalDark} />
      <path d="M40 8l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill={C.blueLight} stroke={C.blue} strokeWidth="0.6" />
      <path d="M8 6l.7 1.8 1.8.7-1.8.7L8 11l-.7-1.8-1.8-.7 1.8-.7z" fill={C.blueLight} stroke={C.blue} strokeWidth="0.5" />
    </Svg>
  );
}

/** `resume` — paper document with a folded corner and a generic red PDF band. */
export function ResumeIcon(props: IconProps) {
  const id = useSvgIds("paper", "band");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.paper} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.paper} />
          <stop offset="1" stopColor={C.paperShade} />
        </linearGradient>
        <linearGradient id={id.band} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.redLight} />
          <stop offset="0.3" stopColor={C.red} />
          <stop offset="1" stopColor={C.redDark} />
        </linearGradient>
      </defs>
      <GroundShadow rx={14} />
      <path d="M10 4h20l9 9v29H10z" fill={`url(#${id.paper})`} stroke={C.outline} strokeWidth="1" strokeLinejoin="round" />
      <path d="M30 4v9h9" fill={C.paperShade} stroke={C.outline} strokeWidth="1" strokeLinejoin="round" />
      <path d="M14 12h12M14 16h20M14 20h20M14 24h16" stroke={C.paperLine} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="6" y="28" width="30" height="11" rx="1.5" fill={`url(#${id.band})`} stroke={C.redDark} strokeWidth="1" />
      <text
        x="21"
        y="36.6"
        textAnchor="middle"
        fontFamily="Tahoma, Verdana, sans-serif"
        fontSize="8"
        fontWeight="700"
        fill="#ffffff"
      >
        PDF
      </text>
    </Svg>
  );
}

/** `contact` — envelope in front of an address card. */
export function ContactIcon(props: IconProps) {
  const id = useSvgIds("env", "card");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.env} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffef4" />
          <stop offset="1" stopColor="#e2dcc2" />
        </linearGradient>
        <linearGradient id={id.card} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.blueLight} />
          <stop offset="1" stopColor={C.blue} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <rect x="14" y="5" width="28" height="20" rx="2" fill={`url(#${id.card})`} stroke={C.blueDark} strokeWidth="1" />
      <circle cx="21" cy="12" r="3" fill="#ffffff" opacity="0.9" />
      <path d="M27 11h11M27 15h9" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
      <rect x="4" y="16" width="36" height="25" rx="2" fill={`url(#${id.env})`} stroke={C.beigeDark} strokeWidth="1" />
      <path d="M4.8 17.5L22 31l17.2-13.5" fill="none" stroke={C.beigeDark} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.8 40l13-11M39.2 40l-13-11" stroke={C.beige} strokeWidth="1" />
      <circle cx="22" cy="30.5" r="3" fill={C.red} stroke={C.redDark} strokeWidth="0.8" />
    </Svg>
  );
}

/** `display` — monitor showing a tiny "Morning Waves" wallpaper. */
export function DisplayIcon(props: IconProps) {
  const id = useSvgIds("bezel", "sky", "stand");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.bezel} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.beigeLight} />
          <stop offset="1" stopColor={C.beige} />
        </linearGradient>
        <linearGradient id={id.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a6fd6" />
          <stop offset="1" stopColor="#a9d0ff" />
        </linearGradient>
        <linearGradient id={id.stand} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.beige} />
          <stop offset="1" stopColor={C.beigeDark} />
        </linearGradient>
      </defs>
      <GroundShadow rx={14} />
      <path d="M18 34h12l2 6H16z" fill={`url(#${id.stand})`} stroke={C.beigeDark} strokeWidth="1" />
      <rect x="12" y="39.5" width="24" height="3" rx="1.5" fill={C.beige} stroke={C.beigeDark} strokeWidth="1" />
      <rect x="4" y="6" width="40" height="29" rx="3" fill={`url(#${id.bezel})`} stroke={C.beigeDark} strokeWidth="1" />
      <rect x="8" y="9.5" width="32" height="21" fill={`url(#${id.sky})`} stroke={C.outline} strokeWidth="0.8" />
      <path d="M8.4 22c5-3 10 1.5 16-1s10-3.5 15.2-2v11.4H8.4z" fill="#8cc8ff" />
      <path d="M8.4 24.6c5-3 10 1.5 16-1s10-3.5 15.2-2" fill="none" stroke={C.greenLight} strokeWidth="1" />
      <path d="M8.4 27c5.5-2.5 11 1 17-1s9-2.5 14.2-1.5v5.6H8.4z" fill="#123c9c" />
      <rect x="21" y="12" width="6" height="6" rx="1.6" fill="#ffffff" opacity="0.6" />
    </Svg>
  );
}

/** `achievements` (stage 11) — golden trophy cup on a little plinth. */
export function AchievementsIcon(props: IconProps) {
  const id = useSvgIds("cup", "base");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.cup} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.yellowLight} />
          <stop offset="0.6" stopColor={C.yellow} />
          <stop offset="1" stopColor={C.yellowDark} />
        </linearGradient>
        <linearGradient id={id.base} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.leatherLight} />
          <stop offset="1" stopColor={C.leatherDark} />
        </linearGradient>
      </defs>
      <GroundShadow rx={13} />
      <path d="M13 9H8.5c0 7 2.5 11 7.5 12M35 9h4.5c0 7-2.5 11-7.5 12" fill="none" stroke={C.yellowDark} strokeWidth="2.4" />
      <path d="M12 6h24v6c0 9-5 15-12 15S12 21 12 12z" fill={`url(#${id.cup})`} stroke={C.yellowDark} strokeWidth="1" />
      <path d="M21 27h6v6h-6z" fill={C.yellow} stroke={C.yellowDark} strokeWidth="1" />
      <rect x="15" y="33" width="18" height="9" rx="1.5" fill={`url(#${id.base})`} stroke={C.leatherDark} strokeWidth="1" />
      <rect x="19" y="36" width="10" height="3" rx="0.8" fill={C.yellowLight} />
      <path d="M17 9c0 5 1.5 9 4 11" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
      <path d="M24 10.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#ffffff" opacity="0.85" />
    </Svg>
  );
}
