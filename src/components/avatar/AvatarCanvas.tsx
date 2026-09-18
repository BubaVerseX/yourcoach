"use client";

import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { buildHumanoid } from "@/lib/avatar/buildHumanoid";
import type { AvatarParams } from "@/lib/avatar/types";

function HumanoidModel({ params }: { params: AvatarParams }) {
  const rig = useMemo(() => buildHumanoid(params), [params]);
  const ref = useRef<THREE.Group>(null);

  return <primitive ref={ref} object={rig.group} />;
}

/**
 * The actual WebGL scene. Kept as a separate component from the lazy-loaded
 * public entry point (AvatarViewer) so the heavy three.js/R3F import cost is
 * paid only once this mounts, never at module-eval time.
 */
export function AvatarCanvas({
  params,
  accentHex = "#e11d1d",
}: {
  params: AvatarParams;
  accentHex?: string;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 4.6], fov: 25 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[1.5, 2.5, 2]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-2, 1, -1.5]} intensity={0.35} color={accentHex} />
      <HumanoidModel params={params} />
      <ContactShadows position={[0, -1.05, 0]} opacity={0.45} blur={2.2} far={1.6} />
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
