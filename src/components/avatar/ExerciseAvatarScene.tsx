"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { buildHumanoid } from "@/lib/avatar/buildHumanoid";
import { applyPattern, applyGlow, regionsForMuscles, type MovementPattern } from "@/lib/avatar/animation";
import { DEFAULT_AVATAR_PARAMS } from "@/lib/avatar/types";

function AnimatedHumanoid({
  pattern,
  primaryMuscles,
  secondaryMuscles,
}: {
  pattern: MovementPattern;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}) {
  // A fixed generic figure, deliberately not the user's own saved goal
  // avatar — this is a reference illustration of the movement, same for
  // every viewer, not a personalized body.
  const rig = useMemo(() => buildHumanoid(DEFAULT_AVATAR_PARAMS), []);
  const primaryRegions = useMemo(() => regionsForMuscles(primaryMuscles), [primaryMuscles]);
  const secondaryRegions = useMemo(() => regionsForMuscles(secondaryMuscles), [secondaryMuscles]);
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    applyPattern(rig, pattern, state.clock.elapsedTime);
    applyGlow(rig, primaryRegions, secondaryRegions, state.clock.elapsedTime);
  });

  return <primitive ref={ref} object={rig.group} />;
}

/** The actual WebGL scene — kept separate from the lazy-loaded public entry
 * point so the three.js/R3F bundle cost is paid only once this mounts. */
export function ExerciseAvatarScene({
  pattern,
  primaryMuscles,
  secondaryMuscles,
}: {
  pattern: MovementPattern;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 4.6], fov: 25 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[1.5, 2.5, 2]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-2, 1, -1.5]} intensity={0.3} color="#0d6efd" />
      <AnimatedHumanoid pattern={pattern} primaryMuscles={primaryMuscles} secondaryMuscles={secondaryMuscles} />
      <ContactShadows position={[0, -1.05, 0]} opacity={0.4} blur={2.2} far={1.6} />
      <OrbitControls
        enablePan={false}
        minDistance={2.2}
        maxDistance={7}
        maxPolarAngle={Math.PI * 0.62}
        minPolarAngle={Math.PI * 0.2}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
