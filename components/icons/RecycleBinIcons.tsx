/**
 * The DouglasOS Recycle Bin (stage 6): an original wire-mesh office basket —
 * a tapered cylinder with a rolled rim and a diamond wire weave — drawn in the
 * same glossy 48px style as the launcher icons (DESIGN-GUIDELINES →
 * Iconography: own wire-basket design, never the classic OS glyph).
 * `RecycleBinFullIcon` adds crumpled paper peeking over the rim; the desktop
 * shows it for a moment while an icon is being rescued.
 */
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";
import { GroundShadow, Svg } from "@/components/icons/AppIcons";

function Basket({ full }: { full: boolean }) {
  const id = useSvgIds("body", "rim", "inside", "clip", "paper");
  return (
    <>
      <defs>
        <linearGradient id={id.body} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.metalDark} stopOpacity="0.55" />
          <stop offset="0.35" stopColor={C.metalLight} stopOpacity="0.35" />
          <stop offset="1" stopColor={C.metalDark} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={id.rim} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.metalLight} />
          <stop offset="1" stopColor={C.metal} />
        </linearGradient>
        <linearGradient id={id.inside} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.metalDark} />
          <stop offset="1" stopColor={C.metal} />
        </linearGradient>
        <linearGradient id={id.paper} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.paper} />
          <stop offset="1" stopColor={C.paperShade} />
        </linearGradient>
        <clipPath id={id.clip}>
          <path d="M9 12h30l-3.6 29.5a2 2 0 0 1-2 1.5H14.6a2 2 0 0 1-2-1.5z" />
        </clipPath>
      </defs>
      <GroundShadow cy={44.5} rx={13} />
      {/* Back of the rim (the basket's open mouth). */}
      <ellipse cx="24" cy="12" rx="15" ry="3.6" fill={`url(#${id.inside})`} />
      {full && (
        <g stroke={C.paperLine} strokeWidth="0.8" strokeLinejoin="round">
          <path d="M11 13l2.5-8.5 5 2.5 3-6 4.5 4.5 4-3.5 2 6.5 4.5-2L37 13z" fill={`url(#${id.paper})`} />
          <path d="M15.5 8l3 3.5M24.5 3.5l-1.5 6M31 6l-1.5 4.5" fill="none" />
          <path d="M25 11l6-8.5 5.5 5-3 4.5z" fill={C.yellowLight} stroke={C.yellowDark} />
          <path d="M12 12.5l4-5 4.5 3-2 3z" fill={C.blueLight} stroke={C.blueDark} />
        </g>
      )}
      {/* Body: translucent metal with a diamond wire weave. */}
      <path
        d="M9 12h30l-3.6 29.5a2 2 0 0 1-2 1.5H14.6a2 2 0 0 1-2-1.5z"
        fill={`url(#${id.body})`}
      />
      <g clipPath={`url(#${id.clip})`} stroke={C.metalDark} strokeWidth="0.9" opacity="0.85">
        {[-24, -16, -8, 0, 8, 16, 24, 32].map((o) => (
          <path key={`a${o}`} d={`M${o} 12l${28} 32`} />
        ))}
        {[16, 24, 32, 40, 48, 56, 64, 72].map((o) => (
          <path key={`b${o}`} d={`M${o} 12l${-28} 32`} />
        ))}
      </g>
      {/* Base band and vertical highlight. */}
      <path d="M12.3 38.5h23.4l-.35 3a2 2 0 0 1-2 1.5H14.6a2 2 0 0 1-2-1.5z" fill={C.metal} stroke={C.metalDark} strokeWidth="0.8" />
      <path d="M14 15.5l2.3 22" stroke={C.paper} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      {/* Outline + rolled rim in front. */}
      <path
        d="M9 12h30l-3.6 29.5a2 2 0 0 1-2 1.5H14.6a2 2 0 0 1-2-1.5z"
        fill="none"
        stroke={C.outline}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <ellipse cx="24" cy="12" rx="15.5" ry="3.9" fill="none" stroke={`url(#${id.rim})`} strokeWidth="2.4" />
      <ellipse cx="24" cy="12" rx="16.7" ry="5.1" fill="none" stroke={C.outline} strokeWidth="0.8" />
    </>
  );
}

/** Empty bin (its usual state: mini Douglas never lets anything stay). */
export function RecycleBinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <Basket full={false} />
    </Svg>
  );
}

/** Bin with paper over the rim, shown briefly while an icon is rescued. */
export function RecycleBinFullIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <Basket full />
    </Svg>
  );
}
