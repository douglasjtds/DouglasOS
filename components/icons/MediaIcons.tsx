/**
 * DouglasOS Media Player artwork: the app icon (a glossy blue screen with a
 * green play triangle and three equalizer bars), the tray note and the tray
 * speaker. All original — never the classic media player's logo or icons.
 */
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";
import { GroundShadow, Svg } from "@/components/icons/AppIcons";

/** `media-player` — rounded screen, play triangle, equalizer bars. */
export function MediaPlayerIcon(props: IconProps) {
  const id = useSvgIds("body", "screen", "play");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.blueLight} />
          <stop offset="1" stopColor={C.blueDark} />
        </linearGradient>
        <linearGradient id={id.screen} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2f5e" />
          <stop offset="1" stopColor="#050c1f" />
        </linearGradient>
        <linearGradient id={id.play} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.greenLight} />
          <stop offset="1" stopColor={C.green} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <rect x="4" y="7" width="40" height="34" rx="8" fill={`url(#${id.body})`} stroke={C.outline} strokeWidth="1" />
      <rect x="8.5" y="11.5" width="31" height="20" rx="3" fill={`url(#${id.screen})`} stroke={C.outline} strokeWidth="0.8" />
      <path d="M19 15.5l9 5.5-9 5.5z" fill={`url(#${id.play})`} stroke={C.greenDark} strokeWidth="0.8" strokeLinejoin="round" />
      <rect x="12" y="34" width="3" height="4" rx="0.8" fill={C.yellow} />
      <rect x="17" y="33" width="3" height="5" rx="0.8" fill={C.greenLight} />
      <rect x="22" y="34.5" width="3" height="3.5" rx="0.8" fill={C.orange} />
      <circle cx="36" cy="36" r="2.4" fill={C.paper} opacity="0.85" />
      <path d="M9 12.5h30" stroke={C.paper} strokeOpacity="0.25" strokeWidth="1" />
    </Svg>
  );
}

/** Tray "now playing" note. */
export function NowPlayingIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M18 8l22-4v26.5a6.5 5.2 0 1 1-4-4.8V12.5l-14 2.6v19.4a6.5 5.2 0 1 1-4-4.8z"
        fill={C.yellow}
        stroke={C.yellowDark}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Tray speaker; `muted` draws a red cross instead of the waves. */
export function VolumeIcon({ muted = false, ...props }: IconProps & { muted?: boolean }) {
  return (
    <Svg {...props}>
      <path d="M6 18h8l12-10v32L14 30H6z" fill={C.metalLight} stroke={C.outline} strokeWidth="2.5" strokeLinejoin="round" />
      {muted ? (
        <path d="M31 17l12 14M43 17L31 31" stroke={C.red} strokeWidth="4" strokeLinecap="round" />
      ) : (
        <>
          <path d="M31 17q4 7 0 14" fill="none" stroke={C.paper} strokeWidth="3" strokeLinecap="round" />
          <path d="M36 12q8 12 0 24" fill="none" stroke={C.paper} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

/** Start → All Programs folder (Accessories, Entertainment…). */
export function ProgramFolderIcon(props: IconProps) {
  const id = useSvgIds("folder");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.folder} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.yellowLight} />
          <stop offset="1" stopColor={C.yellow} />
        </linearGradient>
      </defs>
      <path d="M4 12a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill={`url(#${id.folder})`} stroke={C.yellowDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 19h40" stroke={C.yellowDark} strokeWidth="1.5" opacity="0.6" />
    </Svg>
  );
}
