/**
 * DouglasOS Messenger artwork: the app icon (one buddy in a DouglasOS-blue
 * hoodie with a speech bubble — deliberately not a two-person or butterfly
 * mark) and the emoticon set. All original; no other messenger's logo or
 * emoticons. Illustration-local colors come from `ICON_COLORS` plus a few
 * skin/face tones documented here.
 */
import type { ReactNode } from "react";
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";
import { GroundShadow, Svg } from "@/components/icons/AppIcons";
import type { EmoticonId } from "@/lib/messenger/emoticons";

/** Face tones for the buddy and the emoticons. */
const FACE = {
  skin: "#f3c79a",
  skinShade: "#d99a63",
  hair: "#3b2a1e",
  yellow: "#ffd84a",
  yellowEdge: "#c99a12",
  ink: "#3a2a05",
  blush: "#f08a6c",
} as const;

/** `messenger` — a buddy with a speech bubble and an "online" dot. */
export function MessengerIcon(props: IconProps) {
  const id = useSvgIds("hoodie", "bubble", "dot");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.hoodie} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.blueLight} />
          <stop offset="1" stopColor={C.blueDark} />
        </linearGradient>
        <linearGradient id={id.bubble} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.paper} />
          <stop offset="1" stopColor="#cfe3ff" />
        </linearGradient>
        <radialGradient id={id.dot} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={C.greenLight} />
          <stop offset="1" stopColor={C.green} />
        </radialGradient>
      </defs>
      <GroundShadow cx={20} rx={15} />
      {/* Buddy: shoulders in a hoodie, head, hair. */}
      <path
        d="M5 43c0-9 6-14 14-14s14 5 14 14z"
        fill={`url(#${id.hoodie})`}
        stroke={C.outline}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M14 30.5l5 5 5-5" fill="none" stroke={C.paper} strokeOpacity="0.7" strokeWidth="1.4" />
      <circle cx="19" cy="21" r="8" fill={FACE.skin} stroke={FACE.skinShade} strokeWidth="1" />
      <path d="M11.2 19.5c0-5.2 3.6-8 7.8-8s7.8 2.8 7.8 8c-2-2.4-5-3.4-7.8-3.4s-5.8 1-7.8 3.4z" fill={FACE.hair} />
      <circle cx="16.3" cy="22" r="1" fill={FACE.ink} />
      <circle cx="21.7" cy="22" r="1" fill={FACE.ink} />
      <path d="M16.3 25.2q2.7 2.2 5.4 0" fill="none" stroke={FACE.ink} strokeWidth="1" strokeLinecap="round" />
      {/* Speech bubble with typing dots. */}
      <path
        d="M27 4h15a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-8l-5 4.5 1-4.5h-3a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z"
        fill={`url(#${id.bubble})`}
        stroke={C.blue}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="29.5" cy="12.5" r="1.8" fill={C.blue} />
      <circle cx="34.5" cy="12.5" r="1.8" fill={C.blue} />
      <circle cx="39.5" cy="12.5" r="1.8" fill={C.blue} />
      {/* Online dot. */}
      <circle cx="31" cy="38" r="5" fill={`url(#${id.dot})`} stroke={C.paper} strokeWidth="1.5" />
    </Svg>
  );
}

function Face({ size = 19, label, children }: { size?: number; label: string; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      role="img"
      aria-label={label}
      focusable="false"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "text-bottom" }}
    >
      {children}
    </svg>
  );
}

function Round({ children }: { children?: ReactNode }) {
  return (
    <>
      <circle cx="10" cy="10" r="8.6" fill={FACE.yellow} stroke={FACE.yellowEdge} strokeWidth="1" />
      <ellipse cx="7.5" cy="5.6" rx="3.4" ry="1.8" fill="#ffffff" opacity="0.45" />
      {children}
    </>
  );
}

const eyes = (
  <>
    <ellipse cx="7" cy="8.2" rx="1.1" ry="1.5" fill={FACE.ink} />
    <ellipse cx="13" cy="8.2" rx="1.1" ry="1.5" fill={FACE.ink} />
  </>
);

const FACES: Record<EmoticonId, ReactNode> = {
  smile: (
    <Round>
      {eyes}
      <path d="M6 11.6q4 3.6 8 0" fill="none" stroke={FACE.ink} strokeWidth="1.3" strokeLinecap="round" />
    </Round>
  ),
  grin: (
    <Round>
      {eyes}
      <path d="M5.6 11h8.8q-.6 4.6-4.4 4.6T5.6 11z" fill="#ffffff" stroke={FACE.ink} strokeWidth="1.1" strokeLinejoin="round" />
    </Round>
  ),
  wink: (
    <Round>
      <ellipse cx="7" cy="8.2" rx="1.1" ry="1.5" fill={FACE.ink} />
      <path d="M11.6 8.4q1.4-1.2 2.8 0" fill="none" stroke={FACE.ink} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 11.6q4 3.6 8 0" fill="none" stroke={FACE.ink} strokeWidth="1.3" strokeLinecap="round" />
    </Round>
  ),
  tongue: (
    <Round>
      {eyes}
      <path d="M6 11.8h8" stroke={FACE.ink} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.6 12v1.8a1.4 1.4 0 0 0 2.8 0V12z" fill={FACE.blush} stroke={FACE.ink} strokeWidth="0.8" />
    </Round>
  ),
  surprised: (
    <Round>
      <circle cx="7" cy="7.8" r="1.4" fill={FACE.ink} />
      <circle cx="13" cy="7.8" r="1.4" fill={FACE.ink} />
      <ellipse cx="10" cy="13" rx="1.8" ry="2.2" fill={FACE.ink} />
    </Round>
  ),
  sad: (
    <Round>
      {eyes}
      <path d="M6.4 14.4q3.6-3.2 7.2 0" fill="none" stroke={FACE.ink} strokeWidth="1.3" strokeLinecap="round" />
    </Round>
  ),
  cool: (
    <Round>
      <path d="M3.6 7h12.8v1.2l-1 2.6h-3.6L10.8 8.6H9.2L8.2 10.8H4.6l-1-2.6z" fill="#1c2430" />
      <path d="M6.4 12.4q3.6 2.6 7.2 0" fill="none" stroke={FACE.ink} strokeWidth="1.3" strokeLinecap="round" />
    </Round>
  ),
  heart: (
    <path
      d="M10 17.2S2.2 12.4 2.2 7.2A3.9 3.9 0 0 1 10 5.4a3.9 3.9 0 0 1 7.8 1.8c0 5.2-7.8 10-7.8 10z"
      fill={C.red}
      stroke={C.redDark}
      strokeWidth="1"
      strokeLinejoin="round"
    />
  ),
  thumbsUp: (
    <path
      d="M3 9h3v8H3zM7 9.4l3-5.6c1.2 0 2 .8 1.8 2.2L11.4 8H16a1.6 1.6 0 0 1 1.5 2l-1.4 5.6A1.8 1.8 0 0 1 14.4 17H7z"
      fill={FACE.yellow}
      stroke={FACE.yellowEdge}
      strokeWidth="1"
      strokeLinejoin="round"
    />
  ),
  coffee: (
    <>
      <path d="M3.4 8h10v5.4a3.6 3.6 0 0 1-3.6 3.6H7a3.6 3.6 0 0 1-3.6-3.6z" fill={C.paper} stroke={C.metalDark} strokeWidth="1" />
      <path d="M13.4 9.4h1.4a2 2 0 0 1 0 4h-1.6" fill="none" stroke={C.metalDark} strokeWidth="1.2" />
      <path d="M4.4 9.2h8v1.6h-8z" fill={C.leather} />
      <path d="M6.4 6.4q-1-1.4 0-2.8M9.4 6.4q-1-1.4 0-2.8" fill="none" stroke={C.metal} strokeWidth="1" strokeLinecap="round" />
    </>
  ),
};

/** One emoticon, as an image with an accessible name. */
export function Emoticon({ id, label, size }: { id: EmoticonId; label: string; size?: number }) {
  return (
    <Face size={size} label={label}>
      {FACES[id]}
    </Face>
  );
}
