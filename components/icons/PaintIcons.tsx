/**
 * Stage 10 launcher icons, original drawings in the shared glossy style (48px
 * master): DouglasOS Paint (a wooden artist's palette with paint blobs and a
 * brush laid across it, never the classic program's icon) and "DON'T OPEN
 * THIS.exe" (a program file sealed with caution tape).
 */
import { GroundShadow, Svg } from "@/components/icons/AppIcons";
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";

/** `dont-open-this`: a program window-file wrapped in diagonal caution tape. */
export function DontOpenThisIcon(props: IconProps) {
  const id = useSvgIds("file", "tape", "clip");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.file} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.paper} />
          <stop offset="1" stopColor={C.paperShade} />
        </linearGradient>
        <pattern id={id.tape} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill={C.yellow} />
          <rect width="4" height="8" fill={C.shadow} opacity="0.85" />
        </pattern>
        <clipPath id={id.clip}>
          <rect x="7" y="6" width="34" height="36" rx="3" />
        </clipPath>
      </defs>
      <GroundShadow />
      <rect x="7" y="6" width="34" height="36" rx="3" fill={`url(#${id.file})`} stroke={C.outline} strokeWidth="1" />
      <rect x="7.5" y="6.5" width="33" height="7" rx="2.5" fill={C.blue} />
      <rect x="11" y="18" width="20" height="2" rx="1" fill={C.paperLine} />
      <rect x="11" y="23" width="24" height="2" rx="1" fill={C.paperLine} />
      <rect x="11" y="28" width="16" height="2" rx="1" fill={C.paperLine} />
      <g clipPath={`url(#${id.clip})`}>
        <path d="M-2 34 50 14v8L-2 42z" fill={`url(#${id.tape})`} stroke={C.yellowDark} strokeWidth="0.8" />
      </g>
      <circle cx="37" cy="37" r="7" fill={C.red} stroke={C.redDark} strokeWidth="1" />
      <rect x="35.8" y="32.5" width="2.4" height="5.6" rx="1" fill={C.paper} />
      <circle cx="37" cy="40.4" r="1.3" fill={C.paper} />
    </Svg>
  );
}

export function PaintIcon(props: IconProps) {
  const id = useSvgIds("wood", "handle");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.wood} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.yellowLight} />
          <stop offset="1" stopColor={C.leatherLight} />
        </linearGradient>
        <linearGradient id={id.handle} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.redLight} />
          <stop offset="1" stopColor={C.red} />
        </linearGradient>
      </defs>
      <GroundShadow />
      {/* Palette with a thumb hole */}
      <path
        d="M24 7c10.5 0 19 6.6 19 15.2 0 5.4-4.2 7.4-8.4 6.6-3-.6-4.6 1.4-3.7 4.1 1 3.2-1.4 6.1-6.9 6.1C13.5 39 5 32.2 5 23.2S13.5 7 24 7z"
        fill={`url(#${id.wood})`}
        stroke={C.leatherDark}
        strokeWidth="1"
      />
      <ellipse cx="30.5" cy="30" rx="2.6" ry="2.1" fill={C.paperShade} stroke={C.leatherDark} strokeWidth="0.8" />
      <circle cx="14" cy="18" r="3.2" fill={C.blue} stroke={C.blueDark} strokeWidth="0.6" />
      <circle cx="22.5" cy="13.5" r="3.2" fill={C.yellow} stroke={C.yellowDark} strokeWidth="0.6" />
      <circle cx="31.5" cy="15" r="3.2" fill={C.green} stroke={C.greenDark} strokeWidth="0.6" />
      <circle cx="12.5" cy="27" r="3.2" fill={C.red} stroke={C.redDark} strokeWidth="0.6" />
      {/* Brush across the palette */}
      <path d="M44 6 27.5 26.5" stroke={`url(#${id.handle})`} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M28.6 25 26 28.2" stroke={C.metal} strokeWidth="3.6" />
      <path d="M26 28.2c-1.6 2-3.6 2.7-5.6 2.8 1-1.8 1.3-3.8 3.4-5.5z" fill={C.blueDark} />
    </Svg>
  );
}
