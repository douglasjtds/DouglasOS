/**
 * Stage 12 game icons: original drawings in the shared glossy style (48px
 * master), never traced from any real OS icon. The Games folder, Mines (a
 * flagged tile), Solitaire (two fanned cards), FreeCell (a card in an open
 * cell), Hearts (a heart card), Spider Solitaire (a card with a web) and
 * Pinball (a ball over a flipper).
 */
import { GroundShadow, Svg } from "@/components/icons/AppIcons";
import { ICON_COLORS as C, useSvgIds, type IconProps } from "@/components/icons/types";

/** A blank card outline, shared by the card-game icons. */
function Card({
  x,
  y,
  rotate = 0,
  fill,
}: {
  x: number;
  y: number;
  rotate?: number;
  fill: string;
}) {
  return (
    <rect
      x={x}
      y={y}
      width="22"
      height="30"
      rx="2.5"
      fill={fill}
      stroke={C.outline}
      strokeWidth="1"
      transform={rotate ? `rotate(${rotate} ${x + 11} ${y + 15})` : undefined}
    />
  );
}

/** A small heart path centred on (cx, cy). */
function heartPath(cx: number, cy: number, s: number) {
  return `M${cx} ${cy + 3.2 * s}c-${4.6 * s}-${3 * s}-${6 * s}-${5.2 * s}-${6 * s}-${7.2 * s}a${3 * s} ${3 * s} 0 0 1 ${6 * s}-${1 * s}a${3 * s} ${3 * s} 0 0 1 ${6 * s} ${1 * s}c0 ${2 * s}-${1.4 * s} ${4.2 * s}-${6 * s} ${7.2 * s}z`;
}

/** Desktop "Games" folder and the All Programs ▸ Games folder: a folder with a card and a die. */
export function GamesFolderIcon(props: IconProps) {
  const id = useSvgIds("folder", "front");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.folder} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.yellowLight} />
          <stop offset="1" stopColor={C.yellow} />
        </linearGradient>
        <linearGradient id={id.front} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.yellow} />
          <stop offset="1" stopColor={C.yellowDark} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill={`url(#${id.folder})`} stroke={C.yellowDark} strokeWidth="1.5" strokeLinejoin="round" />
      {/* A card and a die peeking out of the folder */}
      <rect x="11" y="9" width="14" height="19" rx="1.8" fill={C.paper} stroke={C.outline} strokeWidth="0.9" transform="rotate(-10 18 18)" />
      <path d={heartPath(17.5, 17, 0.7)} fill={C.red} transform="rotate(-10 18 18)" />
      <rect x="26" y="11" width="13" height="13" rx="2.5" fill={C.paper} stroke={C.outline} strokeWidth="0.9" transform="rotate(12 32.5 17.5)" />
      <circle cx="29.5" cy="14.5" r="1.2" fill={C.blueDark} />
      <circle cx="32.5" cy="17.5" r="1.2" fill={C.blueDark} />
      <circle cx="35.5" cy="20.5" r="1.2" fill={C.blueDark} />
      <path d="M4 22h40v17a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill={`url(#${id.front})`} stroke={C.yellowDark} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 23.5h38" stroke={C.yellowLight} strokeWidth="1" opacity="0.8" />
    </Svg>
  );
}

/** `mines`: a raised tile grid with one revealed number and a flagged tile. */
export function MinesIcon(props: IconProps) {
  const id = useSvgIds("tile");
  const tiles = [
    [8, 8],
    [24, 8],
    [8, 24],
    [24, 24],
  ] as const;
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.tile} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.metalLight} />
          <stop offset="1" stopColor={C.metal} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <rect x="6" y="6" width="36" height="36" rx="2" fill={C.metalDark} stroke={C.outline} strokeWidth="1" />
      {tiles.map(([x, y], i) =>
        i === 2 ? (
          <rect key={i} x={x} y={y} width="16" height="16" fill={C.beigeLight} stroke={C.beige} strokeWidth="0.8" />
        ) : (
          <rect key={i} x={x} y={y} width="16" height="16" rx="1" fill={`url(#${id.tile})`} stroke={C.metalDark} strokeWidth="0.8" />
        ),
      )}
      <text x="16" y="37.5" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="Tahoma, sans-serif" fill={C.blue}>
        2
      </text>
      {/* Flag on the top-right tile */}
      <path d="M31 11v10" stroke={C.shadow} strokeWidth="1.4" />
      <path d="M31 11.5 38 14.5 31 17.5z" fill={C.red} stroke={C.redDark} strokeWidth="0.6" />
      <rect x="28" y="20.5" width="6.5" height="1.8" rx="0.6" fill={C.shadow} />
    </Svg>
  );
}

/** `solitaire`: two fanned cards, a spade over a heart. */
export function SolitaireIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <GroundShadow />
      <Card x={9} y={8} rotate={-14} fill={C.paper} />
      <path d={heartPath(18, 22, 0.9)} fill={C.red} transform="rotate(-14 20 23)" />
      <Card x={18} y={10} rotate={10} fill={C.paper} />
      <g transform="rotate(10 29 25)">
        <path d="M29 18c-3.8 3.6-6.4 5.6-6.4 8.2a3 3 0 0 0 5.2 2l-1.1 3.6h4.6l-1.1-3.6a3 3 0 0 0 5.2-2c0-2.6-2.6-4.6-6.4-8.2z" fill={C.shadow} />
      </g>
    </Svg>
  );
}

/** `freecell`: a card standing in an open slot with a corner arrow. */
export function FreeCellIcon(props: IconProps) {
  const id = useSvgIds("slot");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.slot} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.greenLight} />
          <stop offset="1" stopColor={C.green} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <rect x="5" y="6" width="38" height="36" rx="3" fill={`url(#${id.slot})`} stroke={C.greenDark} strokeWidth="1" />
      <rect x="9" y="10" width="15" height="21" rx="1.5" fill="none" stroke={C.paper} strokeWidth="1" strokeDasharray="2 1.5" opacity="0.9" />
      <Card x={18} y={10} fill={C.paper} />
      <text x="29" y="31" textAnchor="middle" fontSize="13" fontWeight="700" fontFamily="Tahoma, sans-serif" fill={C.red}>
        A
      </text>
      <path d="M10 37h9m-3-3 3 3-3 3" stroke={C.paper} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** `hearts`: a single card with a big glossy heart. */
export function HeartsIcon(props: IconProps) {
  const id = useSvgIds("heart");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.heart} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.redLight} />
          <stop offset="1" stopColor={C.red} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <rect x="11" y="5" width="26" height="36" rx="3" fill={C.paper} stroke={C.outline} strokeWidth="1" />
      <path d={heartPath(24, 25, 1.45)} fill={`url(#${id.heart})`} stroke={C.redDark} strokeWidth="0.8" />
      <ellipse cx="20" cy="19" rx="2.2" ry="1.4" fill={C.paper} opacity="0.55" />
      <path d={heartPath(15, 10.5, 0.35)} fill={C.red} />
      <path d={heartPath(33, 35.5, 0.35)} fill={C.red} transform="rotate(180 33 34)" />
    </Svg>
  );
}

/** `spider`: a card with a corner web and a small round spider. */
export function SpiderIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <GroundShadow />
      <Card x={8} y={9} rotate={-8} fill={C.paperShade} />
      <rect x="15" y="6" width="26" height="35" rx="3" fill={C.paper} stroke={C.outline} strokeWidth="1" />
      <g stroke={C.paperLine} strokeWidth="0.8" fill="none">
        <path d="M41 6 25 22M41 6v18M41 6H23" />
        <path d="M35 6c0 3 2 5 6 6M29 6c0 6 5 11 12 12M26 10c3 6 9 10 15 11" />
      </g>
      <path d="M28 27v6" stroke={C.shadow} strokeWidth="0.8" />
      <g stroke={C.shadow} strokeWidth="1" strokeLinecap="round" fill="none">
        <path d="M25 33l-4-2.5M25 35l-4.5 0M25 37l-4 2.5M31 33l4-2.5M31 35l4.5 0M31 37l4 2.5" />
      </g>
      <ellipse cx="28" cy="35.5" rx="3.6" ry="4.2" fill={C.shadow} />
      <circle cx="28" cy="31" r="2.2" fill={C.shadow} />
      <ellipse cx="27" cy="34" rx="1" ry="1.4" fill={C.paper} opacity="0.35" />
    </Svg>
  );
}

/** `pinball`: a chrome ball rolling over a flipper on a starry blue table. */
export function PinballIcon(props: IconProps) {
  const id = useSvgIds("table", "ball", "flipper");
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id={id.table} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.blue} />
          <stop offset="1" stopColor={C.blueDark} />
        </linearGradient>
        <radialGradient id={id.ball} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor={C.paper} />
          <stop offset="0.45" stopColor={C.metal} />
          <stop offset="1" stopColor={C.metalDark} />
        </radialGradient>
        <linearGradient id={id.flipper} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.yellowLight} />
          <stop offset="1" stopColor={C.orange} />
        </linearGradient>
      </defs>
      <GroundShadow />
      <rect x="7" y="5" width="34" height="37" rx="5" fill={`url(#${id.table})`} stroke={C.outline} strokeWidth="1" />
      <circle cx="15" cy="12" r="1" fill={C.yellowLight} />
      <circle cx="33" cy="10" r="0.8" fill={C.paper} />
      <circle cx="35" cy="19" r="1" fill={C.yellowLight} />
      <circle cx="13" cy="22" r="0.7" fill={C.paper} />
      <circle cx="24" cy="14" r="4.5" fill={C.red} stroke={C.redDark} strokeWidth="1" />
      <circle cx="24" cy="14" r="2" fill={C.redLight} />
      <path d="M10 35 26 31.5a2.4 2.4 0 0 1 .6 4.7L11 39a2.2 2.2 0 0 1-1-4z" fill={`url(#${id.flipper})`} stroke={C.leatherDark} strokeWidth="0.8" />
      <circle cx="29" cy="25" r="5" fill={`url(#${id.ball})`} stroke={C.metalDark} strokeWidth="0.8" />
    </Svg>
  );
}
