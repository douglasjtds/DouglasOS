"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import type * as THREE from "three";

const PARTICLE_COUNT = 90;
const FIELD_RADIUS = 9;
const TARGET_FPS = 30;

/** Random positions inside a flattened sphere so particles hug the viewport. */
function makePositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = FIELD_RADIUS * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    positions[i * 3 + 2] = r * Math.cos(phi) * 0.5 - 2;
  }
  return positions;
}

function ParticleField({
  color,
  count,
  size,
  speed,
}: {
  color: string;
  count: number;
  size: number;
  speed: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => makePositions(count), [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    // Slow ambient drift — presence, not distraction.
    ref.current.rotation.y += delta * speed;
    ref.current.rotation.x += delta * speed * 0.35;
  });

  return (
    <Points ref={ref} positions={positions} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation
        depthWrite={false}
        opacity={0.55}
      />
    </Points>
  );
}

/** Caps renders at ~30 FPS: a demand frameloop only draws when invalidated,
 *  and this ticker invalidates on a fixed interval instead of every rAF. */
function FrameLimiter() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const interval = setInterval(() => invalidate(), 1000 / TARGET_FPS);
    return () => clearInterval(interval);
  }, [invalidate]);
  return null;
}

/**
 * The ambient 3D desktop background (DESIGN-GUIDELINES.md §3D Scene):
 * two low-density particle layers — cyan primary, purple sparse — drifting
 * slowly behind the desktop icons. Pointer events pass straight through.
 */
export default function AmbientScene() {
  return (
    <Canvas
      className="pointer-events-none"
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 55 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      aria-hidden
    >
      <FrameLimiter />
      <ParticleField color="#00d9ff" count={PARTICLE_COUNT} size={0.055} speed={0.02} />
      <ParticleField color="#7c3aed" count={Math.round(PARTICLE_COUNT / 3)} size={0.075} speed={-0.014} />
    </Canvas>
  );
}
