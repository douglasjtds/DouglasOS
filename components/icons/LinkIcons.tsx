/**
 * Original DouglasOS icons for the external shortcuts (stage 3), in the same
 * glossy early-2000s style as `AppIcons.tsx`. They are deliberately generic:
 * a globe with an "in" monogram tag, a code tile with a branch glyph, a chat
 * bubble and an "@" envelope. No service's official logo is reproduced. Each
 * carries our own shortcut-arrow overlay in the bottom-left corner
 * (DESIGN-GUIDELINES → Iconography).
 */
import { GroundShadow, Svg } from "@/components/icons/AppIcons";
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";

/** Shortcut-arrow overlay: white tile with a curved blue arrow, bottom-left. */
function ShortcutArrow() {
  return (
    <g>
      <rect x="2.5" y="29.5" width="15" height="15" rx="1.5" fill={C.paper} stroke={C.outline} strokeWidth="1" />
      <path
        d="M6 41.5c0-5.5 2.8-8 7.5-8"
        fill="none"
        stroke={C.blue}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M11.5 30.6l4.4 2.9-4.4 2.9z" fill={C.blue} stroke={C.blue} strokeWidth="0.8" strokeLinejoin="round" />
    </g>
  );
}

/** `linkedin` — a web globe with a blue "in" monogram tag (generic, not the logo). */
export function LinkedInLinkIcon(props: IconProps) {
  const id = useSvgIds("globe", "tag");
  return (
    <Svg {...props}>
      <defs>
        <radialGradient id={id.globe} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#d9ecff" />
          <stop offset="0.5" stopColor={C.blueLight} />
          <stop offset="1" stopColor={C.blueDark} />
        </radialGradient>
        <linearGradient id={id.tag} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.blueLight} />
          <stop offset="1" stopColor={C.blueDark} />
        </linearGradient>
      </defs>
      <GroundShadow cx={27} />
      <circle cx="24" cy="19" r="15" fill={`url(#${id.globe})`} stroke={C.outline} strokeWidth="1" />
      <ellipse cx="24" cy="19" rx="6.5" ry="15" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1" />
      <path d="M9.5 15h29M9.5 23h29M24 4v30" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1" />
      <path d="M14 9c2-1.6 4-2.4 6-2.5-1 2-1.3 3.4-.4 4.6-2.4.4-4.2-.2-5.6-2.1z" fill={C.greenLight} opacity="0.85" />
      <path d="M28 25c2.5-.6 5-.2 7 1-1.4 2.4-3.4 4-6 4.6-.2-2-.6-3.8-1-5.6z" fill={C.greenLight} opacity="0.85" />
      <rect x="23" y="24" width="21" height="17" rx="3" fill={`url(#${id.tag})`} stroke={C.blueDark} strokeWidth="1" />
      <path d="M25 26.5h17" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
      <text
        x="33.5"
        y="37.6"
        textAnchor="middle"
        fontFamily="Tahoma, Verdana, sans-serif"
        fontSize="12"
        fontWeight="700"
        fill="#ffffff"
      >
        in
      </text>
      <ShortcutArrow />
    </Svg>
  );
}

/** `github` — a dark code tile with "</>" and a branch glyph (generic, not the logo). */
export function GitHubLinkIcon(props: IconProps) {
  const id = useSvgIds("tile", "gloss");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.tile} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6577" />
          <stop offset="0.35" stopColor="#323a48" />
          <stop offset="1" stopColor="#151a22" />
        </linearGradient>
        <linearGradient id={id.gloss} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <GroundShadow cx={26} />
      <rect x="7" y="5" width="37" height="35" rx="5" fill={`url(#${id.tile})`} stroke="#0d1016" strokeWidth="1" />
      <path d="M8 10a4.5 4.5 0 0 1 4.5-4.5h26A4.5 4.5 0 0 1 43 10v6H8z" fill={`url(#${id.gloss})`} />
      <path
        d="M18 13l-6 6 6 6M33 13l6 6-6 6M28 11l-5 16"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27 31v4.5M27 33c0-1.5 5-1 5-3.5" fill="none" stroke={C.greenLight} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="27" cy="31" r="1.7" fill={C.greenLight} />
      <circle cx="27" cy="36.5" r="1.7" fill={C.greenLight} />
      <circle cx="32" cy="29.5" r="1.7" fill={C.yellow} />
      <ShortcutArrow />
    </Svg>
  );
}

/** `whatsapp` — a green chat bubble with typing dots (generic, not the logo). */
export function WhatsAppLinkIcon(props: IconProps) {
  const id = useSvgIds("bubble");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.bubble} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b6ef9e" />
          <stop offset="0.3" stopColor={C.greenLight} />
          <stop offset="1" stopColor={C.green} />
        </linearGradient>
      </defs>
      <GroundShadow cx={27} />
      <path
        d="M12 5h28a5 5 0 0 1 5 5v19a5 5 0 0 1-5 5h-3l1.5 7-8.5-7H12a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5z"
        fill={`url(#${id.bubble})`}
        stroke={C.greenDark}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M11 9.5h30" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="17" cy="20" r="3" fill="#ffffff" />
      <circle cx="26" cy="20" r="3" fill="#ffffff" />
      <circle cx="35" cy="20" r="3" fill="#ffffff" />
      <ShortcutArrow />
    </Svg>
  );
}

/** `email` — a sealed blue envelope with an "@" stamp. */
export function EmailLinkIcon(props: IconProps) {
  const id = useSvgIds("env", "seal");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.env} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.paper} />
          <stop offset="1" stopColor="#c9dcf6" />
        </linearGradient>
        <radialGradient id={id.seal} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={C.yellowLight} />
          <stop offset="1" stopColor={C.orange} />
        </radialGradient>
      </defs>
      <GroundShadow cx={26} />
      <rect x="6" y="9" width="38" height="28" rx="2.5" fill={`url(#${id.env})`} stroke={C.outline} strokeWidth="1" />
      <path d="M6.8 10.5L25 25l18.2-14.5" fill="none" stroke={C.blue} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.8 36l13.5-11.5M43.2 36L29.7 24.5" stroke={C.paperLine} strokeWidth="1" />
      <circle cx="35" cy="30" r="8" fill={`url(#${id.seal})`} stroke={C.yellowDark} strokeWidth="1" />
      <text
        x="35"
        y="34"
        textAnchor="middle"
        fontFamily="Tahoma, Verdana, sans-serif"
        fontSize="11"
        fontWeight="700"
        fill={C.redDark}
      >
        @
      </text>
      <ShortcutArrow />
    </Svg>
  );
}
