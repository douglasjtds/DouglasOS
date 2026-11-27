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
 * and to the right inside the box, so the motorcycle fits behind him on the
 * left and the skateboard under his feet.
 */
const CHARACTER_PLACEMENT = "translate(57 103.5) scale(0.86) translate(-48 -105.5)";

/** Five-spoke blacked-out cast wheel (Iron-style), tire included. */
function Wheel({ cx }: { cx: number }) {
  const cy = 99.5;
  return (
    <g>
      <circle cx={cx} cy={cy} r="9" fill={INK} />
      <circle cx={cx} cy={cy} r="6.4" fill={TEE} stroke={C.metalDark} strokeWidth="0.6" />
      {[0, 72, 144, 216, 288].map((a) => (
        <path
          key={a}
          d={`M${cx} ${cy} L${cx} ${cy - 6}`}
          transform={`rotate(${a} ${cx} ${cy})`}
          stroke={C.metalDark}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ))}
      <circle cx={cx} cy={cy} r="1.6" fill={C.metalLight} />
    </g>
  );
}

/**
 * His bike, parked behind him and facing left: a blacked-out, café-ish
 * V-twin in the spirit of a small-displacement cruiser — peanut tank, round
 * headlight, low drag bars, fork gaiters, solo seat, chopped rear fender,
 * twin shocks and staggered shotgun pipes. Original drawing: no badges,
 * logos or wordmarks.
 */
/**
 * The bike is drawn on the 0–55 range and pulled forward (left) so most of it
 * shows beside him instead of behind him; the front spills a little past the
 * box's left edge (the SVG is `overflow-visible`; clicks still only hit the box).
 */
const MOTORCYCLE_PLACEMENT = "translate(-18 0)";

function Motorcycle() {
  return (
    <g data-accessory="motorcycle" transform={MOTORCYCLE_PLACEMENT}>
      <ellipse cx="26" cy="108.8" rx="29" ry="2" fill={C.shadow} opacity="0.22" />
      <Wheel cx={7} />
      <Wheel cx={46} />
      {/* Front brake disc. */}
      <circle cx="7" cy="99.5" r="3.6" fill="none" stroke={C.metal} strokeWidth="1" />

      {/* Chopped rear fender + front fender stub. */}
      <path d="M37.6 93.5 A9.8 9.8 0 0 1 55.2 95" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M0.5 93.2 A9.4 9.4 0 0 1 12.4 91.6" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Frame: backbone, downtube, swingarm. */}
      <path d="M15 74 L23 78 L42 81 L46 99.5" stroke={INK} strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M15.5 75 L19.5 98.5 L30 99.5 L46 99.5" stroke={INK} strokeWidth="2" fill="none" strokeLinejoin="round" />
      {/* Twin rear shocks (coil hint). */}
      <path d="M41 81.5 L45 97" stroke={C.metal} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M41.6 84 l1.6 -0.4 M42.2 86.4 l1.6 -0.4 M42.8 88.8 l1.6 -0.4 M43.4 91.2 l1.6 -0.4" stroke={C.metalDark} strokeWidth="0.7" />

      {/* Raked fork with rubber gaiters on the lower legs. */}
      <path d="M7 99.5 L14.5 73.5" stroke={C.metal} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.6 93.8 L11.2 84.8" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M9 91.6 l1.4 0.4 M9.6 89.4 l1.4 0.4 M10.2 87.2 l1.4 0.4" stroke={TEE_LINE} strokeWidth="0.6" />

      {/* V-twin: blacked-out cylinders with bright fin edges, crankcase, round air cleaner. */}
      <ellipse cx="26.5" cy="96" rx="7.4" ry="4.4" fill={C.metalDark} stroke={INK} strokeWidth="0.8" />
      <g transform="rotate(-22 23 87)">
        <rect x="19.6" y="81" width="6.8" height="11" rx="1.2" fill={INK} />
        <path d="M19.6 83 h6.8 M19.6 85.2 h6.8 M19.6 87.4 h6.8 M19.6 89.6 h6.8" stroke={C.metal} strokeWidth="0.6" />
      </g>
      <g transform="rotate(22 30 87)">
        <rect x="26.6" y="81" width="6.8" height="11" rx="1.2" fill={INK} />
        <path d="M26.6 83 h6.8 M26.6 85.2 h6.8 M26.6 87.4 h6.8 M26.6 89.6 h6.8" stroke={C.metal} strokeWidth="0.6" />
      </g>
      <circle cx="31.6" cy="89.6" r="3.1" fill={C.metal} stroke={C.metalDark} strokeWidth="0.8" />
      <circle cx="31.6" cy="89.6" r="1.2" fill={C.metalDark} />
      {/* Battery box / oil tank under the seat. */}
      <rect x="34.6" y="82" width="5.4" height="7.4" rx="1" fill={INK} stroke={TEE_LINE} strokeWidth="0.5" />

      {/* Staggered shotgun pipes, slash-cut ends. */}
      {[
        "M21 92.5 C21.5 101 27 101.4 36 101.4 L54.5 99.6",
        "M29 93.5 C29.8 103 33 103.8 40 103.8 L54.5 102.6",
      ].map((d) => (
        <g key={d}>
          <path d={d} stroke={C.metalDark} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d={d} stroke={C.metalLight} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* Peanut tank (matte black, one thin stripe) + solo seat. */}
      <path d="M16.6 77.2 C17 73.2 22 72.2 27.2 73 C30.8 73.6 32.4 75.8 31.8 78 C27 79.8 21 80.2 16.6 77.2 Z" fill={INK} />
      <path d="M19 76.4 C22.5 75.2 26.5 75.2 30 76.2" stroke={C.orange} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M31.4 77.6 C34.4 76.2 39.2 76.6 42.8 79.4 L42.2 81.2 L31.8 80.6 Z" fill={C.leatherDark} />

      {/* Low drag bars + grip, round mirror, round headlight. */}
      <path d="M14.5 73.5 L15.5 70.5 L10.5 70 L9 70.4" stroke={C.metalDark} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 70.4 L11 70.2" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M14.8 70.6 L13.6 65.6" stroke={C.metalDark} strokeWidth="0.8" />
      <circle cx="13.4" cy="64.8" r="1.4" fill={INK} stroke={C.metal} strokeWidth="0.5" />
      <circle cx="11" cy="75.6" r="3.2" fill={INK} />
      <circle cx="10.5" cy="75.6" r="2.2" fill={C.yellowLight} stroke={C.metalDark} strokeWidth="0.6" />
    </g>
  );
}

/**
 * One kickflip, take-off to landing (seconds; matches
 * `ASSISTANT_TIMING.kickflip`). He crouches, pops, the board flips once
 * around its long axis under him (`scaleY` 1 → −1 → 1 reads as the flip from
 * the side) and he lands back on it.
 */
const KICKFLIP: Transition = { duration: 1.2, ease: "easeInOut", times: [0, 0.15, 0.35, 0.6, 0.85, 1] };
const KICKFLIP_BODY = { y: [0, 2, -18, -18, 0, 0], rotate: [0, 0, -4, 4, 0, 0] };
const KICKFLIP_BOARD = { y: [0, 0, -15, -15, 0, 0], scaleY: [1, 1, -1, 1, 1, 1], rotate: [0, 0, -6, 6, 0, 0] };

/** A skateboard under his feet; `kickflipping` flips it once (animated only). */
function Skateboard({ kickflipping }: { kickflipping: boolean }) {
  return (
    <g data-accessory="skateboard">
      {/* The shadow stays on the ground while the board is in the air. */}
      <ellipse cx="58" cy="110.4" rx="25" ry="1.6" fill={C.shadow} opacity="0.22" />
      <motion.g
        data-kickflip={kickflipping || undefined}
        animate={kickflipping ? KICKFLIP_BOARD : { y: 0, scaleY: 1, rotate: 0 }}
        transition={kickflipping ? KICKFLIP : { duration: 0.15 }}
        style={{ originX: "50%", originY: "50%" }}
      >
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
      </motion.g>
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
 * talking = mouth moves, dancing = sway, hop and waving arms, kickflipping =
 * one jump while the board flips under him. Under reduced motion it renders
 * one static frame (a music note marks a dance, a tilted board a kickflip).
 * On a desktop he also follows the cursor (`gaze`: eyes + head tilt) and makes
 * a face about it (`expression`: curious / happy / sleepy / surprised).
 */
export function PlaceholderCharacter({ state, reducedMotion, gaze, expression = "neutral" }: CharacterRendererProps) {
  const animate = !reducedMotion;
  const dancing = state === "dancing";
  const talking = state === "talking";
  const kickflipping = state === "kickflipping" && animate;
  const face: CharacterExpression = !animate ? "neutral" : kickflipping ? "surprised" : expression;
  const look = FACES[face];

  // Without a gaze source he looks straight ahead.
  const still = useMotionValue(0);
  const eyeX = useTransform(gaze?.x ?? still, (v) => v * GAZE_TUNING.eyeMaxX);
  const eyeY = useTransform(gaze?.y ?? still, (v) => v * GAZE_TUNING.eyeMaxY);
  const tilt = gaze?.tilt ?? still;
  const blinking = animate && face !== "sleepy" && face !== "happy";

  const body = !animate
    ? undefined
    : kickflipping
      ? KICKFLIP_BODY
      : dancing
        ? { y: [0, -7, 0, -7, 0], rotate: [-6, 0, 6, 0, -6] }
        : { y: [0, -1.5, 0], rotate: 0 };
  const bodyTransition: Transition = kickflipping
    ? KICKFLIP
    : dancing
      ? { ...LOOP, duration: 1.1 }
      : { ...LOOP, duration: 3 };

  // Kickflip: arms out for balance while he's in the air.
  const leftArm = !animate
    ? { rotate: 0 }
    : kickflipping
      ? { rotate: [0, 0, 70, 70, 0, 0] }
      : dancing
        ? { rotate: [10, 150, 110, 150, 10] }
        : { rotate: 0 };
  const rightArm = !animate
    ? { rotate: 0 }
    : kickflipping
      ? { rotate: [0, 0, -70, -70, 0, 0] }
      : dancing
        ? { rotate: [-150, -10, -150, -110, -150] }
        : { rotate: 0 };
  const armTransition: Transition = kickflipping ? KICKFLIP : { ...LOOP, duration: 1.1 };

  return (
    <svg viewBox="0 0 96 112" className="size-full overflow-visible" aria-hidden focusable="false">
      <Motorcycle />
      <Skateboard kickflipping={kickflipping} />

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
      {/* Reduced motion: a static tilted board says "kickflip" instead of movement. */}
      {state === "kickflipping" && !animate && (
        <g data-kickflip-indicator>
          <circle cx="80" cy="14" r="10" fill={C.paper} stroke={C.outline} strokeWidth="1" />
          <g transform="rotate(-20 80 14)">
            <path d="M72.5 12.5 Q73.2 14.2 75 14.2 H85 Q86.8 14.2 87.5 12.5" stroke={C.red} strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="76" cy="16.6" r="1.3" fill={C.yellow} stroke={C.yellowDark} strokeWidth="0.5" />
            <circle cx="84" cy="16.6" r="1.3" fill={C.yellow} stroke={C.yellowDark} strokeWidth="0.5" />
          </g>
        </g>
      )}
    </svg>
  );
}
