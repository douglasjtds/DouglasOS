/**
 * DouglasOS Explorer glyphs (toolbar + project list). Original drawings in the
 * same glossy style as the launcher icons: round green arrow badges for
 * Back/Forward, a small house for Home and a "case study" page. No browser
 * vendor's logo or button art is traced or imitated.
 */
import { Svg } from "@/components/icons/AppIcons";
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";

/** Glossy green round badge with a white arrow (Back / Forward). */
function ArrowBadge({ props, direction }: { props: IconProps; direction: "back" | "forward" }) {
  const id = useSvgIds("fill");
  const arrow =
    direction === "back"
      ? "M27 13L16 24l11 11M17 24h16"
      : "M21 13l11 11-11 11M31 24H15";
  return (
    <Svg {...props}>
      <defs>
        <radialGradient id={id.fill} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor={C.greenLight} />
          <stop offset="0.6" stopColor={C.green} />
          <stop offset="1" stopColor={C.greenDark} />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#${id.fill})`} stroke={C.greenDark} strokeWidth="1.2" />
      <ellipse cx="20" cy="13" rx="10" ry="5" fill="#ffffff" opacity="0.35" />
      <path
        d={arrow}
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function NavBackIcon(props: IconProps) {
  return <ArrowBadge props={props} direction="back" />;
}

export function NavForwardIcon(props: IconProps) {
  return <ArrowBadge props={props} direction="forward" />;
}

/** Home: a small house with a red roof and a blue door. */
export function NavHomeIcon(props: IconProps) {
  const id = useSvgIds("wall", "roof");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.wall} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.paper} />
          <stop offset="1" stopColor={C.paperShade} />
        </linearGradient>
        <linearGradient id={id.roof} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.redLight} />
          <stop offset="1" stopColor={C.redDark} />
        </linearGradient>
      </defs>
      <path d="M11 22h26v20H11z" fill={`url(#${id.wall})`} stroke={C.outline} strokeWidth="1.5" />
      <path d="M5 24L24 7l19 17z" fill={`url(#${id.roof})`} stroke={C.redDark} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="20" y="29" width="8" height="13" fill={C.blue} stroke={C.blueDark} strokeWidth="1.2" />
      <rect x="30" y="27" width="5" height="5" fill={C.blueLight} stroke={C.outline} strokeWidth="1" />
    </Svg>
  );
}

/** A case-study page: white sheet, blue header band, text lines. */
export function CaseStudyIcon(props: IconProps) {
  const id = useSvgIds("band");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.band} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.blue} />
          <stop offset="1" stopColor={C.blueLight} />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44" rx="15" ry="2.5" fill={C.shadow} opacity={0.22} />
      <path d="M9 4h22l8 8v30H9z" fill={C.paper} stroke={C.outline} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M31 4v8h8" fill={C.paperShade} stroke={C.outline} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="12" y="15" width="24" height="7" fill={`url(#${id.band})`} />
      <path d="M13 27h22M13 31h22M13 35h15" stroke={C.paperLine} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
