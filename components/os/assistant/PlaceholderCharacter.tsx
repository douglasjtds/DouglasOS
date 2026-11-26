"use client";

import { motion, useMotionValue, useTransform, type Transition } from "framer-motion";
import { ICON_COLORS as C } from "@/components/icons/types";
import type { CharacterRendererProps } from "@/components/os/assistant/AssistantCharacter";
import { GAZE_TUNING, type CharacterExpression } from "@/lib/assistant/gaze";

/**
 * Character-local palette (like `ICON_COLORS`, these are illustration colors,
 * not UI tokens). Skin, hair, beard and clothes are the only additions to the
 * icon set.
 */
const SKIN = "#ebbd98";
const SKIN_SHADE = "#c9946c";
const HAIR = "#241811";
const HAIR_FADE = "#5a4535";
const BEARD = "#3b2a1f";
const INK = "#1f1a17";
const TEE = "#1d1d21";
const TEE_LINE = "#3b3b42";
const LIP = "#8a5a46";
const MOUTH = "#5a332a";
const SOCK = "#9a9aa0";
const TATTOO = "#33506e";
const TATTOO_SHADE = "#2a3a4a";

const LOOP: Transition = { repeat: Infinity, ease: "easeInOut" };
/** Quick, slightly bouncy change of face. */
const FACE: Transition = { type: "spring", stiffness: 320, damping: 22 };

/** Per-expression tweaks of the face (brow lift, eye size). */
const FACES: Record<CharacterExpression, { browY: number; eyeRx: number; eyeRy: number }> = {
  neutral: { browY: 0, eyeRx: 2.1, eyeRy: 2.6 },
  curious: { browY: -2, eyeRx: 2.4, eyeRy: 3 },
  happy: { browY: -1, eyeRx: 2.1, eyeRy: 2.6 },
  sleepy: { browY: 0.8, eyeRx: 2.1, eyeRy: 2.6 },
  surprised: { browY: -3, eyeRx: 2.6, eyeRy: 3.5 },
};

/** Resting mouth per expression (talking and dancing use the moving mouth). */
function RestingMouth({ expression }: { expression: CharacterExpression }) {
  switch (expression) {
    case "happy":
      return <path d="M43.5 47.4 Q48 54 52.5 47.4 Z" fill={MOUTH} stroke={LIP} strokeWidth="1" strokeLinejoin="round" />;
    case "surprised":
      return <ellipse cx="48" cy="49" rx="1.9" ry="2.4" fill={MOUTH} stroke={LIP} strokeWidth="1" />;
    case "curious":
      return <path d="M45 48.2 Q48 50 51 48.2" stroke={LIP} strokeWidth="1.6" fill="none" strokeLinecap="round" />;
    case "sleepy":
      return <path d="M45.5 48.8 Q48 49.8 50.5 48.8" stroke={LIP} strokeWidth="1.5" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M44 47.8 Q48 50.8 52 47.8" stroke={LIP} strokeWidth="1.6" fill="none" strokeLinecap="round" />;
  }
}

/**
 * The character is drawn on its own 96×112 grid and placed slightly smaller
 * and to the right inside the box, so the motorcycle fits on the left and the
 * skateboard under his feet.
 */
const CHARACTER_PLACEMENT = "translate(57 103.5) scale(0.86) translate(-48 -105.5)";

/**
 * A small custom bobber parked next to him: generic V-twin, ape-hanger bars,
 * teardrop tank with a flame stripe. Original drawing, no badges or logos.
 */
function Motorcycle() {
  return (
    <g data-accessory="motorcycle">
      <ellipse cx="17" cy="108.6" rx="16" ry="2" fill={C.shadow} opacity="0.22" />
      {/* Exhaust (behind the wheels). */}
      <path d="M15 99.5 L1.5 102" stroke={C.metalDark} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M15 99.5 L1.5 102" stroke={C.metalLight} strokeWidth="1.5" strokeLinecap="round" />
      {/* Wheels. */}
      {[8, 29].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="101" r="6.5" fill={INK} />
          <circle cx={cx} cy="101" r="4" fill={C.metalDark} />
          <circle cx={cx} cy="101" r="1.5" fill={C.metalLight} />
        </g>
      ))}
      {/* Rear fender + frame. */}
      <path d="M2.5 99.5 A6.8 6.8 0 0 1 13 94.5" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M8 101 L14 93.5 L23 93.5 L26.5 88" stroke={INK} strokeWidth="2" fill="none" strokeLinejoin="round" />
      {/* V-twin engine. */}
      <circle cx="16" cy="97" r="3.2" fill={C.metal} stroke={C.metalDark} strokeWidth="0.8" />
      <circle cx="21" cy="96.3" r="2.8" fill={C.metal} stroke={C.metalDark} strokeWidth="0.8" />
      {/* Raked fork + ape-hanger bars + headlight. */}
      <path d="M26.5 88 L29 101" stroke={C.metal} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M26.5 88 L25.2 82.5 L29.5 83" stroke={C.metalDark} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28.6" cy="90.2" r="1.9" fill={C.yellowLight} stroke={C.metalDark} strokeWidth="0.7" />
      {/* Teardrop tank with flame stripe + leather seat. */}
      <path d="M15 90.5 C16.5 86.6 25 86.4 26.8 89.6 C25 92 18 92.4 15 90.5 Z" fill={INK} />
      <path d="M17 89.6 C20 88.3 23 88.6 25.2 89.5" stroke={C.orange} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M7.5 91 C9.5 88.6 13.5 88.6 15.4 90.4 L15 91.9 L8.4 91.9 Z" fill={C.leatherDark} />
    </g>
  );
}

/** A skateboard under his feet. */
function Skateboard() {
  return (
    <g data-accessory="skateboard">
      <ellipse cx="58" cy="110.4" rx="25" ry="1.6" fill={C.shadow} opacity="0.22" />
      {/* Trucks + wheels. */}
      <rect x="41.5" y="105.4" width="8" height="1.6" rx="0.8" fill={C.metalDark} />
      <rect x="66.5" y="105.4" width="8" height="1.6" rx="0.8" fill={C.metalDark} />
      {[42.5, 48.5, 67.5, 73.5].map((cx) => (
        <circle key={cx} cx={cx} cy="108.2" r="1.9" fill={C.yellow} stroke={C.yellowDark} strokeWidth="0.6" />
      ))}
      {/* Deck with kicktails: dark grip tape over a red ply edge. */}
      <path
        d="M33.5 101.6 Q35 104.6 39.5 104.6 H76.5 Q81 104.6 82.5 101.6"
        stroke={C.red}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M33.5 101 Q35 104 39.5 104 H76.5 Q81 104 82.5 101"
        stroke={INK}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * Original placeholder for mini Douglas until the recorded clips arrive,
 * drawn after his photo: buzzed hair, round black glasses, trimmed beard, wired
 * in-ear, black tee with a chain, a tattoo sleeve on his left arm, beige
 * shorts, tattooed legs, grey socks.
 * He rides a skateboard with his custom motorcycle parked beside him, all on
 * the same 96×112 box as the video. Idle = gentle bob + blink,
 * talking = mouth moves, dancing = sway, hop and waving arms. Under reduced
 * motion it renders one static frame (a music note marks a dance).
 * On a desktop he also follows the cursor (`gaze`: eyes + head tilt) and makes
 * a face about it (`expression`: curious / happy / sleepy / surprised).
 */
export function PlaceholderCharacter({ state, reducedMotion, gaze, expression = "neutral" }: CharacterRendererProps) {
  const animate = !reducedMotion;
  const dancing = state === "dancing";
  const talking = state === "talking";
  const face: CharacterExpression = animate ? expression : "neutral";
  const look = FACES[face];

  // Without a gaze source he looks straight ahead.
  const still = useMotionValue(0);
  const eyeX = useTransform(gaze?.x ?? still, (v) => v * GAZE_TUNING.eyeMaxX);
  const eyeY = useTransform(gaze?.y ?? still, (v) => v * GAZE_TUNING.eyeMaxY);
  const tilt = gaze?.tilt ?? still;
  const blinking = animate && face !== "sleepy" && face !== "happy";

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
      <Motorcycle />
      <Skateboard />

      <g transform={CHARACTER_PLACEMENT}>
        <motion.g
          animate={body}
          transition={bodyTransition}
          style={{ originX: "50%", originY: "100%" }}
        >
          {/* Legs: tattoos on the left one, grey socks, dark sneakers. */}
          <rect x="37" y="90" width="9" height="12" rx="3" fill={SKIN} />
          <rect x="50" y="90" width="9" height="12" rx="3" fill={SKIN} />
          <circle cx="40" cy="93.5" r="1.7" fill={C.red} opacity="0.85" />
          <circle cx="43" cy="96" r="1.3" fill={TATTOO} />
          <path d="M38.5 98 q2.5 -1.5 5 0" stroke={C.greenDark} strokeWidth="0.9" fill="none" />
          <rect x="37" y="97.5" width="9" height="3.5" fill={SOCK} />
          <rect x="50" y="97.5" width="9" height="3.5" fill={SOCK} />
          <ellipse cx="40.5" cy="102" rx="7" ry="3.6" fill={INK} stroke={C.paper} strokeWidth="1" />
          <ellipse cx="55.5" cy="102" rx="7" ry="3.6" fill={INK} stroke={C.paper} strokeWidth="1" />

          {/* Beige corduroy shorts. */}
          <rect x="31" y="78" width="34" height="15" rx="4" fill={C.beigeLight} stroke={C.beige} strokeWidth="1" />
          <path d="M48 83 V93 M36 83 v8 M42 83 v8 M54 83 v8 M60 83 v8" stroke={C.beige} strokeWidth="0.7" />

          {/* Arms (behind the torso), pivoting at the shoulders. */}
          <motion.g animate={leftArm} transition={armTransition} style={{ originX: "85%", originY: "12%" }}>
            <path d="M33 62 L29.5 69" stroke={TEE} strokeWidth="8.5" strokeLinecap="round" />
            <path d="M29.5 69 L24 80" stroke={SKIN} strokeWidth="6" strokeLinecap="round" />
            <circle cx="23.5" cy="81.5" r="3.8" fill={SKIN} />
          </motion.g>
          <motion.g animate={rightArm} transition={armTransition} style={{ originX: "15%", originY: "12%" }}>
            <path d="M63 62 L66.5 69" stroke={TEE} strokeWidth="8.5" strokeLinecap="round" />
            <path d="M66.5 69 L72 80" stroke={SKIN} strokeWidth="6" strokeLinecap="round" />
            {/* His left arm: a full tattoo sleeve from the tee to the wrist. */}
            <g data-tattoo="left-sleeve">
              <path d="M66.8 69.5 L71.4 79" stroke={TATTOO_SHADE} strokeWidth="6" strokeLinecap="round" opacity="0.45" />
              <circle cx="68" cy="71.8" r="1.8" fill={C.red} stroke={TATTOO_SHADE} strokeWidth="0.5" />
              <path d="M69.2 70.6 q1.8 0.2 2 1.8" stroke={C.green} strokeWidth="1" fill="none" strokeLinecap="round" />
              <path d="M67.6 74.6 q2.8 -0.3 3.6 2.2" stroke={TATTOO_SHADE} strokeWidth="1.1" fill="none" strokeLinecap="round" />
              <circle cx="71" cy="76" r="1.2" fill={C.yellow} stroke={TATTOO_SHADE} strokeWidth="0.4" />
              <path d="M69.3 78.3 l1.4 -1.2 l0.5 1.8 z" fill={C.blue} />
            </g>
            <circle cx="72.5" cy="81.5" r="3.8" fill={SKIN} />
          </motion.g>

          {/* Black tee with a small rose + wordmark line, untucked over the shorts. */}
          <rect x="30" y="56" width="36" height="30" rx="10" fill={TEE} stroke={INK} strokeWidth="1.2" />
          <path d="M40 57 Q48 62.5 56 57" fill="none" stroke={TEE_LINE} strokeWidth="1.2" />
          <circle cx="48" cy="74" r="2.3" fill={C.orange} stroke={C.redDark} strokeWidth="0.7" />
          <rect x="40" y="77.5" width="16" height="1.5" rx="0.75" fill={C.paper} opacity="0.85" />
          {/* Chain with a pendant. */}
          <path d="M42 57.5 Q44 63.5 47.5 66 M54 57.5 Q52 63.5 48.5 66" stroke={C.metal} strokeWidth="0.9" fill="none" />
          <rect x="46.4" y="65.5" width="3.2" height="4.2" rx="1" fill={C.metal} stroke={C.metalDark} strokeWidth="0.6" />

          {/* Neck (stays put; the head above tilts toward the cursor). */}
          <rect x="44" y="50" width="8" height="8" rx="2" fill={SKIN_SHADE} />
          <motion.g data-character-head style={{ rotate: tilt, originX: "50%", originY: "100%" }}>
            {/* Ears. */}
            <circle cx="27.5" cy="37" r="4" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1" />
            <circle cx="68.5" cy="37" r="4" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1" />
            {/* Head. */}
            <circle cx="48" cy="34" r="21" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1.2" />
            {/* Hair: short buzz with a faded side. */}
            <path
              d="M27.5 33 C27 19 37 12.5 48 12.5 C59 12.5 69 19 68.5 33 C66.5 27 62.5 23 56 22.2 C51 21.5 45 21.5 40 22.2 C33.5 23 29.5 27 27.5 33 Z"
              fill={HAIR}
            />
            <path d="M28 33 C28.5 29 30 26.5 32 25" stroke={HAIR_FADE} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M68 33 C67.5 29 66 26.5 64 25" stroke={HAIR_FADE} strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Trimmed beard: fuller on the cheeks and jaw sides, light moustache. */}
            <path
              d="M29 38 C29.5 50 37.5 55.8 48 55.8 C58.5 55.8 66.5 50 67 38 C65.5 44 62 48.5 57 50.5 C53 51.8 43 51.8 39 50.5 C34 48.5 30.5 44 29 38 Z"
              fill={BEARD}
              opacity="0.9"
            />
            <path d="M43.2 45.4 Q48 43.4 52.8 45.4" stroke={BEARD} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.9" />

            {/* Brows, eyes (blink), round black glasses. */}
            {/* Brows lift with curiosity/surprise. */}
            <motion.path
              d="M35 27 q5 -2.5 9.5 0 M51.5 27 q5 -2.5 9.5 0"
              stroke={HAIR}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              initial={false}
              animate={{ y: look.browY }}
              transition={FACE}
            />
            {/* Eyes: blink, follow the cursor, change with the expression. */}
            <motion.g
              animate={blinking ? { scaleY: [1, 1, 0.1, 1] } : { scaleY: 1 }}
              transition={blinking ? { repeat: Infinity, duration: 4.2, times: [0, 0.93, 0.96, 1] } : { duration: 0.15 }}
              style={{ originY: "50%" }}
            >
              <motion.g data-character-eyes style={{ x: eyeX, y: eyeY }}>
                {face === "happy" ? (
                  <path
                    d="M37.6 36 q2.4 -3 4.8 0 M53.6 36 q2.4 -3 4.8 0"
                    stroke={INK}
                    strokeWidth="1.7"
                    fill="none"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    <motion.ellipse cx="40" cy="35" fill={INK} initial={false} animate={{ rx: look.eyeRx, ry: look.eyeRy }} transition={FACE} />
                    <motion.ellipse cx="56" cy="35" fill={INK} initial={false} animate={{ rx: look.eyeRx, ry: look.eyeRy }} transition={FACE} />
                    <circle cx="40.8" cy="34" r="0.75" fill={C.paper} />
                    <circle cx="56.8" cy="34" r="0.75" fill={C.paper} />
                    {/* Sleepy lids slide down over the top half of the eyes. */}
                    <motion.g
                      initial={false}
                      animate={{ scaleY: face === "sleepy" ? 1 : 0 }}
                      transition={{ duration: 0.4 }}
                      style={{ originY: "0%" }}
                    >
                      <rect x="37.4" y="31.9" width="5.2" height="3.8" fill={SKIN} />
                      <rect x="53.4" y="31.9" width="5.2" height="3.8" fill={SKIN} />
                      <path d="M37.6 35.7 h4.8 M53.6 35.7 h4.8" stroke={SKIN_SHADE} strokeWidth="1" strokeLinecap="round" />
                    </motion.g>
                  </>
                )}
              </motion.g>
            </motion.g>
            <circle cx="40" cy="35" r="6.2" fill={C.paper} fillOpacity="0.12" stroke={INK} strokeWidth="2.2" />
            <circle cx="56" cy="35" r="6.2" fill={C.paper} fillOpacity="0.12" stroke={INK} strokeWidth="2.2" />
            <path d="M46.2 34.5 Q48 33 49.8 34.5 M33.8 34 L28.5 33 M62.2 34 L67.5 33" stroke={INK} strokeWidth="1.6" fill="none" />

            {/* Mouth. */}
            {talking || dancing ? (
              <motion.ellipse
                cx="48"
                cy="48.6"
                rx="3"
                fill={MOUTH}
                stroke={LIP}
                strokeWidth="1"
                initial={{ ry: 2.6 }}
                animate={animate ? { ry: [1.2, 3.2, 1.2] } : { ry: 2.6 }}
                transition={{ repeat: Infinity, duration: 0.36 }}
              />
            ) : (
              <RestingMouth expression={face} />
            )}

            {/* Wired in-ear on his right ear, cable running into the tee (tilts with the head). */}
            <circle cx="27.5" cy="38" r="2" fill={INK} />
            <path d="M27.5 40 C26.5 49 33 54 37 60" stroke={INK} strokeWidth="0.9" fill="none" />
          </motion.g>
        </motion.g>
      </g>

      {/* Dozing off: a little "z" floats up. */}
      {face === "sleepy" && (
        <motion.path
          data-sleep-indicator
          d="M74 16 h6 l-6 7 h6"
          stroke={C.paper}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ y: [2, -8], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeOut" }}
        />
      )}

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
