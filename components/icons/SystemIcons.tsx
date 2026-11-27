/**
 * DouglasOS brand mark, user avatar (a photo) and system glyphs (Start menu places,
 * dialog semantics). All original drawings — the brand mark is a glossy
 * rounded tile with a "D" monogram, never a flag or window-pane shape.
 */
import type { ReactNode } from "react";
import Image from "next/image";
import { Svg } from "@/components/icons/AppIcons";
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";
import { cn } from "@/lib/utils";

/** The DouglasOS logo: Luna-blue rounded tile, white "D", green accent dot. */
export function DouglasOSLogo(props: IconProps) {
  const id = useSvgIds("tile", "gloss", "dot");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.tile} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5aa2ff" />
          <stop offset="0.55" stopColor="#245ddb" />
          <stop offset="1" stopColor="#123c9c" />
        </linearGradient>
        <linearGradient id={id.gloss} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id.dot} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#a8ec9b" />
          <stop offset="0.5" stopColor="#4fb84a" />
          <stop offset="1" stopColor="#1e5e22" />
        </radialGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="11" fill={`url(#${id.tile})`} stroke="#0c2f80" strokeWidth="1.2" />
      <path d="M6 14a9 9 0 0 1 9-9h18a9 9 0 0 1 9 9v4c-10 4-26 4-36 0z" fill={`url(#${id.gloss})`} />
      <path
        fillRule="evenodd"
        d="M13 11h10.5a13 13 0 0 1 0 26H13zm6 5.5v15h4.2a7.5 7.5 0 0 0 0-15z"
        fill="#ffffff"
      />
      <circle cx="36.5" cy="36.5" r="5.5" fill={`url(#${id.dot})`} stroke="#ffffff" strokeWidth="1.5" />
    </Svg>
  );
}

/**
 * Douglas's user picture: a square crop of the About photo on a white mat,
 * like a Luna user tile. Decorative (`alt=""`) — every caller names the user
 * next to it. `priority` is for the logon screen, where it is above the fold.
 */
export function UserAvatar({ size = 48, className, priority }: IconProps & { priority?: boolean }) {
  return (
    <Image
      src="/about/douglas-avatar.jpg"
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      priority={priority}
      data-user-avatar
      className={cn("block shrink-0 rounded-control border-2 border-surface bg-surface object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Round glossy badge used by the help/info/question/error glyphs. */
function RoundBadge({
  props,
  light,
  mid,
  dark,
  children,
}: {
  props: IconProps;
  light: string;
  mid: string;
  dark: string;
  children: ReactNode;
}) {
  const id = useSvgIds("fill");
  return (
    <Svg {...props}>
      <defs>
        <radialGradient id={id.fill} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor={light} />
          <stop offset="0.6" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#${id.fill})`} stroke={dark} strokeWidth="1.2" />
      <ellipse cx="20" cy="13" rx="10" ry="5" fill="#ffffff" opacity="0.35" />
      {children}
    </Svg>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <RoundBadge props={props} light="#9cc6ff" mid={C.blue} dark={C.blueDark}>
      <path
        d="M18.5 18.5a5.5 5.5 0 1 1 8.2 4.8c-1.7 1-2.7 2-2.7 4v1.2"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="24" cy="34.5" r="2.6" fill="#ffffff" />
    </RoundBadge>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <RoundBadge props={props} light="#9cc6ff" mid="#2a6fd6" dark={C.blueDark}>
      <circle cx="24" cy="14.5" r="2.8" fill="#ffffff" />
      <rect x="21.3" y="20" width="5.4" height="16" rx="1.4" fill="#ffffff" />
    </RoundBadge>
  );
}

export function QuestionIcon(props: IconProps) {
  return <HelpIcon {...props} />;
}

export function ErrorIcon(props: IconProps) {
  return (
    <RoundBadge props={props} light="#ff9a8a" mid="#d11f1f" dark="#7d0f0f">
      <path d="M16.5 16.5l15 15M31.5 16.5l-15 15" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
    </RoundBadge>
  );
}

export function WarningIcon(props: IconProps) {
  const id = useSvgIds("fill");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.fill} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe89a" />
          <stop offset="0.5" stopColor="#f2c230" />
          <stop offset="1" stopColor="#d49a12" />
        </linearGradient>
      </defs>
      <path
        d="M24 4.5c1.2 0 2.2.6 2.8 1.7l17 31c1.2 2.2-.4 4.8-2.8 4.8H7c-2.4 0-4-2.6-2.8-4.8l17-31c.6-1.1 1.6-1.7 2.8-1.7z"
        fill={`url(#${id.fill})`}
        stroke="#9a6c06"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect x="21.4" y="15" width="5.2" height="14" rx="1.4" fill="#2b2b2b" />
      <circle cx="24" cy="34.5" r="2.7" fill="#2b2b2b" />
    </Svg>
  );
}

/** Log Off: amber tile with an exit arrow leaving a door frame. */
export function LogOffIcon(props: IconProps) {
  const id = useSvgIds("fill");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.fill} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd77a" />
          <stop offset="1" stopColor="#e09a1a" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="7" fill={`url(#${id.fill})`} stroke="#9a6406" strokeWidth="1.2" />
      <path d="M22 12h-8v24h8" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M21 24h15m-6-6 6 6-6 6" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Turn Off: red tile with the generic power symbol. */
export function TurnOffIcon(props: IconProps) {
  const id = useSvgIds("fill");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.fill} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f59a7c" />
          <stop offset="0.4" stopColor="#d8461f" />
          <stop offset="1" stopColor="#8f2a10" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="7" fill={`url(#${id.fill})`} stroke="#6e1f0b" strokeWidth="1.2" />
      <path d="M17 15.5a11 11 0 1 0 14 0" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 10v13" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Green round arrow used by "All Programs ▸". */
export function AllProgramsIcon(props: IconProps) {
  return (
    <RoundBadge props={props} light="#a8ec9b" mid="#3a9a35" dark={C.greenDark}>
      <path d="M19 14l12 10-12 10z" fill="#ffffff" />
    </RoundBadge>
  );
}

/**
 * Run… (stage 7): a white command card with a blue prompt chevron and a
 * green "go" arrow leaving it. Original drawing, not the classic glyph.
 */
export function RunIcon(props: IconProps) {
  const id = useSvgIds("card", "go");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.card} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor={C.paperShade} />
        </linearGradient>
        <linearGradient id={id.go} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.greenLight} />
          <stop offset="1" stopColor={C.green} />
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="32" height="30" rx="4" fill={`url(#${id.card})`} stroke={C.outline} strokeWidth="1.4" />
      <rect x="4" y="8" width="32" height="7" rx="3" fill={C.blue} />
      <path d="M10 22l5 4-5 4" fill="none" stroke={C.blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 31h9" stroke={C.paperLine} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M30 24h8v-6l9 10-9 10v-6h-8z"
        fill={`url(#${id.go})`}
        stroke={C.greenDark}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
