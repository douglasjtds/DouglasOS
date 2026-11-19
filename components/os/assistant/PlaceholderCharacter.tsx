"use client";

import { motion, type Transition } from "framer-motion";
import { ICON_COLORS as C } from "@/components/icons/types";
import type { CharacterRendererProps } from "@/components/os/assistant/AssistantCharacter";

/**
 * Character-local palette (like `ICON_COLORS`, these are illustration colors,
 * not UI tokens). Skin and hair are the only additions to the icon set.
 */
const SKIN = "#d99e74";
const SKIN_SHADE = "#b97d55";
const HAIR = "#3a2618";
const INK = "#1f1a17";
const JEANS = "#2f4f86";

const LOOP: Transition = { repeat: Infinity, ease: "easeInOut" };

/**
 * Original placeholder for mini Douglas until the recorded clips arrive: a
 * small stylized developer (big round head, dark hair, blue DouglasOS hoodie,
 * sneakers) drawn on the same 96×112 box as the video. Idle = gentle bob +
 * blink, talking = mouth moves, dancing = sway, hop and waving arms. Under
 * reduced motion it renders one static frame (a music note marks a dance).
 */
export function PlaceholderCharacter({ state, reducedMotion }: CharacterRendererProps) {
  const animate = !reducedMotion;
  const dancing = state === "dancing";
  const talking = state === "talking";

  const body = !animate
    ? undefined
    : dancing
      ? { y: [0, -7, 0, -7, 0], rotate: [-6, 0, 6, 0, -6] }
      : { y: [0, -1.5, 0], rotate: 0 };
  const bodyTransition: Transition = dancing ? { ...LOOP, duration: 1.1 } : { ...LOOP, duration: 3 };

  const leftArm = animate && dancing ? { rotate: [10, 150, 110, 150, 10] } : { rotate: 0 };
  const rightArm = animate && dancing ? { rotate: [-150, -10, -150, -110, -150] } : { rotate: 0 };
  const armTransition: Transition = { ...LOOP, duration: 1.1 };

  return (
    <svg viewBox="0 0 96 112" className="size-full overflow-visible" aria-hidden focusable="false">
      {/* Ground shadow. */}
      <ellipse cx="48" cy="107" rx="22" ry="3.5" fill={C.shadow} opacity="0.28" />
      <motion.g
        animate={body}
        transition={bodyTransition}
        style={{ originX: "50%", originY: "100%" }}
      >
        {/* Legs + sneakers. */}
        <rect x="37" y="84" width="9" height="17" rx="3" fill={JEANS} />
        <rect x="50" y="84" width="9" height="17" rx="3" fill={JEANS} />
        <ellipse cx="40.5" cy="102" rx="7" ry="3.6" fill={C.paper} stroke={C.metalDark} strokeWidth="1" />
        <ellipse cx="55.5" cy="102" rx="7" ry="3.6" fill={C.paper} stroke={C.metalDark} strokeWidth="1" />

        {/* Arms (behind the torso), pivoting at the shoulders. */}
        <motion.g animate={leftArm} transition={armTransition} style={{ originX: "85%", originY: "12%" }}>
          <path d="M33 62 L24 80" stroke={C.blue} strokeWidth="7.5" strokeLinecap="round" />
          <circle cx="23.5" cy="81.5" r="3.8" fill={SKIN} />
        </motion.g>
        <motion.g animate={rightArm} transition={armTransition} style={{ originX: "15%", originY: "12%" }}>
          <path d="M63 62 L72 80" stroke={C.blue} strokeWidth="7.5" strokeLinecap="round" />
          <circle cx="72.5" cy="81.5" r="3.8" fill={SKIN} />
        </motion.g>

        {/* Hoodie with the DouglasOS tile on the chest. */}
        <rect x="30" y="56" width="36" height="33" rx="11" fill={C.blue} stroke={C.blueDark} strokeWidth="1.2" />
        <path d="M38 57 Q48 66 58 57" fill="none" stroke={C.blueDark} strokeWidth="1.2" />
        <path d="M44 62 v6 M52 62 v6" stroke={C.paper} strokeWidth="1.2" strokeLinecap="round" />
        <rect x="43" y="72" width="10" height="10" rx="2.6" fill={C.blueLight} stroke={C.paper} strokeWidth="1" />
        <circle cx="51" cy="80" r="1.8" fill={C.greenLight} />

        {/* Head. */}
        <rect x="44" y="50" width="8" height="8" rx="2" fill={SKIN_SHADE} />
        <circle cx="26.5" cy="37" r="4" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1" />
        <circle cx="69.5" cy="37" r="4" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1" />
        <circle cx="48" cy="34" r="22" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1.2" />
        {/* Hair: short, with a swoop on top. */}
        <path
          d="M26.5 33 C25 18 36 10 49 10.5 C61 11 71 18 69.5 32 C66 25 60 22 53 22.5 C55 19 52 16.5 49 18 C43 20 33 22 26.5 33 Z"
          fill={HAIR}
        />
        {/* Brows, eyes (blink), cheeks, mouth. */}
        <path d="M36 30 q4 -2.5 8 0 M52 30 q4 -2.5 8 0" stroke={HAIR} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <motion.g
          animate={animate ? { scaleY: [1, 1, 0.1, 1] } : undefined}
          transition={{ repeat: Infinity, duration: 4.2, times: [0, 0.93, 0.96, 1] }}
          style={{ originY: "50%" }}
        >
          <ellipse cx="40" cy="36.5" rx="2.6" ry="3.2" fill={INK} />
          <ellipse cx="56" cy="36.5" rx="2.6" ry="3.2" fill={INK} />
          <circle cx="41" cy="35.3" r="0.9" fill={C.paper} />
          <circle cx="57" cy="35.3" r="0.9" fill={C.paper} />
        </motion.g>
        <circle cx="34.5" cy="43" r="3" fill={C.redLight} opacity="0.35" />
        <circle cx="61.5" cy="43" r="3" fill={C.redLight} opacity="0.35" />
        {talking || dancing ? (
          <motion.ellipse
            cx="48"
            cy="46.5"
            rx="4.2"
            fill={C.redDark}
            initial={{ ry: 2.6 }}
            animate={animate ? { ry: [1.2, 3.2, 1.2] } : { ry: 2.6 }}
            transition={{ repeat: Infinity, duration: 0.36 }}
          />
        ) : (
          <path d="M42 45 Q48 50.5 54 45" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}
      </motion.g>

      {/* Reduced motion: a static note says "dancing" instead of movement. */}
      {dancing && !animate && (
        <g data-dance-indicator>
          <circle cx="80" cy="14" r="10" fill={C.paper} stroke={C.outline} strokeWidth="1" />
          <path d="M78 19.5 V9 l6 -1.6 V17" stroke={C.outline} strokeWidth="1.6" fill="none" />
          <circle cx="76.5" cy="19.5" r="2" fill={C.outline} />
          <circle cx="82.5" cy="17" r="2" fill={C.outline} />
        </g>
      )}
    </svg>
  );
}
