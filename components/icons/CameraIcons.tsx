/**
 * Retro Cam (stage 9): an original glossy desk webcam — a round silver head
 * with a big blue lens and a green "on" light, on a small clip stand — drawn
 * in the same 48px style as the launcher icons (DESIGN-GUIDELINES →
 * Iconography). Not traced from any real product or OS icon.
 */
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";
import { GroundShadow, Svg } from "@/components/icons/AppIcons";

export function CameraIcon(props: IconProps) {
  const id = useSvgIds("head", "lens", "stand");
  return (
    <Svg {...props}>
      <defs>
        <radialGradient id={id.head} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor={C.metalLight} />
          <stop offset="0.6" stopColor={C.metal} />
          <stop offset="1" stopColor={C.metalDark} />
        </radialGradient>
        <radialGradient id={id.lens} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor={C.blueLight} />
          <stop offset="0.55" stopColor={C.blue} />
          <stop offset="1" stopColor={C.blueDark} />
        </radialGradient>
        <linearGradient id={id.stand} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.metal} />
          <stop offset="1" stopColor={C.metalDark} />
        </linearGradient>
      </defs>
      <GroundShadow rx={14} />
      {/* Stand: neck + clip foot. */}
      <path d="M21 33h6l1.5 6h-9z" fill={`url(#${id.stand})`} stroke={C.metalDark} strokeWidth="1" />
      <rect x="11" y="38.5" width="26" height="4" rx="2" fill={`url(#${id.stand})`} stroke={C.metalDark} strokeWidth="1" />
      {/* Head. */}
      <circle cx="24" cy="20" r="15" fill={`url(#${id.head})`} stroke={C.outline} strokeWidth="1" />
      {/* Lens ring + glass. */}
      <circle cx="24" cy="20" r="8.5" fill={C.metalDark} stroke={C.outline} strokeWidth="0.8" />
      <circle cx="24" cy="20" r="6.5" fill={`url(#${id.lens})`} />
      <circle cx="24" cy="20" r="2.4" fill={C.blueDark} />
      <ellipse cx="21.5" cy="17.5" rx="2.2" ry="1.4" fill="#ffffff" opacity="0.8" />
      {/* "On" light. */}
      <circle cx="34" cy="11" r="2" fill={C.greenLight} stroke={C.greenDark} strokeWidth="0.8" />
      {/* Gloss on the head. */}
      <path d="M13 15a12 12 0 0 1 9-8" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </Svg>
  );
}

/** Small "accessories" folder for the Start menu's All Programs ▸ Accessories. */
export function AccessoriesFolderIcon(props: IconProps) {
  const id = useSvgIds("back", "front");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.back} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.yellow} />
          <stop offset="1" stopColor={C.yellowDark} />
        </linearGradient>
        <linearGradient id={id.front} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.yellowLight} />
          <stop offset="1" stopColor={C.yellow} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <path d="M5 12a2 2 0 0 1 2-2h11l4 4h19a2 2 0 0 1 2 2v24H5z" fill={`url(#${id.back})`} stroke={C.yellowDark} strokeWidth="1" />
      <path d="M4 19h40l-2 21H6z" fill={`url(#${id.front})`} stroke={C.yellowDark} strokeWidth="1" strokeLinejoin="round" />
      {/* A tiny gear on the front: "tools inside". */}
      <circle cx="24" cy="29.5" r="4.5" fill="none" stroke={C.leather} strokeWidth="2.4" strokeDasharray="2.2 1.3" />
      <circle cx="24" cy="29.5" r="1.6" fill={C.leather} />
    </Svg>
  );
}
