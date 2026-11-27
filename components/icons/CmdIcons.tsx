/**
 * cmd.exe launcher icon, an original drawing in the shared glossy style (48px
 * master): a small black console window with a blue title strip and a `>_`
 * prompt. Never the classic program's icon.
 */
import { GroundShadow, Svg } from "@/components/icons/AppIcons";
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";

export function CmdIcon(props: IconProps) {
  const id = useSvgIds("frame", "screen", "bar");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.frame} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.metalLight} />
          <stop offset="1" stopColor={C.metal} />
        </linearGradient>
        <linearGradient id={id.bar} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.blueLight} />
          <stop offset="1" stopColor={C.blue} />
        </linearGradient>
        <linearGradient id={id.screen} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.shadow} stopOpacity="0.82" />
          <stop offset="1" stopColor={C.shadow} />
        </linearGradient>
      </defs>
      <GroundShadow />
      {/* Window frame with a title strip */}
      <rect x="5" y="7" width="38" height="33" rx="3" fill={`url(#${id.frame})`} stroke={C.outline} strokeWidth="1" />
      <path d="M5.5 10a2.5 2.5 0 0 1 2.5-2.5h32a2.5 2.5 0 0 1 2.5 2.5v3h-37z" fill={`url(#${id.bar})`} />
      <rect x="36" y="9" width="4.5" height="3" rx="0.8" fill={C.redLight} stroke={C.redDark} strokeWidth="0.5" />
      {/* Console screen */}
      <rect x="8" y="15" width="32" height="22" rx="1" fill={`url(#${id.screen})`} stroke={C.metalDark} strokeWidth="0.8" />
      {/* `>_` prompt */}
      <path d="M12 20.5 17 24.5 12 28.5" fill="none" stroke={C.paper} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="19.5" y="27.2" width="8" height="2.2" rx="0.6" fill={C.paper} />
      {/* Glossy highlight */}
      <path d="M8.5 15.5h31v4c-10 1.6-21 1.6-31 0z" fill={C.paper} opacity="0.12" />
    </Svg>
  );
}
