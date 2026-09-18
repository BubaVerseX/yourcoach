import type { HumanoidRig, GlowRegion } from "./buildHumanoid";

/**
 * Five generic movement patterns — every exercise in the catalog maps to
 * whichever of these it most resembles (see exercises.movement_pattern,
 * migration 0010), rather than getting bespoke per-exercise animation.
 */
export type MovementPattern = "squat" | "push" | "pull" | "hinge" | "plank";

type JointTarget = { rest: number; active: number };
type PatternPose = {
  spine: JointTarget;
  hips: JointTarget;
  knees: JointTarget;
  shoulders: JointTarget;
  elbows: JointTarget;
  /** Cycles per second — how fast the loop plays. Slower for the static
   * hold (plank) since it's a brace, not a rep. */
  speed: number;
};

// Rotation.x targets, radians. Every limb hangs "down" from its parent joint
// (see buildHumanoid's limbMesh direction:"down"), so a positive rotation.x
// swings it forward — this is what reads as "bending"/"reaching" from the
// camera's front-ish default view.
export const PATTERN_POSES: Record<MovementPattern, PatternPose> = {
  squat: {
    spine: { rest: 0, active: 0.22 },
    hips: { rest: 0, active: 0.75 },
    knees: { rest: 0, active: 1.3 },
    shoulders: { rest: 0, active: 0.35 },
    elbows: { rest: 0.15, active: 0.15 },
    speed: 0.45,
  },
  push: {
    spine: { rest: 0.12, active: 0.18 },
    hips: { rest: 0.05, active: 0.05 },
    knees: { rest: 0.05, active: 0.05 },
    shoulders: { rest: 0.35, active: 0.35 },
    elbows: { rest: 0.2, active: 1.35 },
    speed: 0.6,
  },
  pull: {
    spine: { rest: 0.18, active: 0.05 },
    hips: { rest: 0.15, active: 0.05 },
    knees: { rest: 0.1, active: 0.05 },
    shoulders: { rest: 0.35, active: -0.55 },
    elbows: { rest: 0.2, active: 1.25 },
    speed: 0.55,
  },
  hinge: {
    spine: { rest: 0.15, active: 0.9 },
    hips: { rest: 0.1, active: 0.55 },
    knees: { rest: 0.05, active: 0.25 },
    shoulders: { rest: 0, active: 0.2 },
    elbows: { rest: 0.1, active: 0.1 },
    speed: 0.4,
  },
  // Isometric hold, not a rep — small amplitude, slower loop, so it reads as
  // "held tension" rather than the sweeping motion of the other four.
  plank: {
    spine: { rest: 0.35, active: 0.4 },
    hips: { rest: 0.1, active: 0.13 },
    knees: { rest: 0.05, active: 0.05 },
    shoulders: { rest: 0.5, active: 0.53 },
    elbows: { rest: 0.1, active: 0.1 },
    speed: 0.25,
  },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Smooth 0→1→0 wave for a continuous, ease-in-out loop (no snap at the
 * endpoints the way a plain sine or sawtooth would read). */
function loopPhase(elapsedSeconds: number, speed: number): number {
  return (1 - Math.cos(elapsedSeconds * speed * Math.PI * 2)) / 2;
}

/** Poses every joint in the rig for the given pattern at the given elapsed
 * time — call from a useFrame loop. Left/right pairs move symmetrically
 * (both legs squat together, both arms push together), which is how the
 * exercises these patterns represent actually move. */
export function applyPattern(rig: HumanoidRig, pattern: MovementPattern, elapsedSeconds: number) {
  const pose = PATTERN_POSES[pattern];
  const phase = loopPhase(elapsedSeconds, pose.speed);

  rig.joints.spine.rotation.x = lerp(pose.spine.rest, pose.spine.active, phase);
  for (const side of ["left", "right"] as const) {
    rig.joints.hips[side].rotation.x = lerp(pose.hips.rest, pose.hips.active, phase);
    rig.joints.knees[side].rotation.x = lerp(pose.knees.rest, pose.knees.active, phase);
    rig.joints.shoulders[side].rotation.x = lerp(pose.shoulders.rest, pose.shoulders.active, phase);
    rig.joints.elbows[side].rotation.x = lerp(pose.elbows.rest, pose.elbows.active, phase);
  }
}

/** DB muscle-group strings (see supabase/migrations/0008) mapped down to the
 * 7 body regions the avatar can actually glow independently — several fine
 * muscle groups share one mesh/material (e.g. chest, lats, and obliques are
 * all part of the single torso mesh), so this is a deliberate, honest
 * simplification rather than exact anatomical highlighting. */
const MUSCLE_TO_REGION: Record<string, GlowRegion> = {
  chest: "torso",
  back_upper: "torso",
  back_lower: "torso",
  trapezius: "torso",
  rhomboids: "torso",
  lats: "torso",
  core: "torso",
  obliques: "torso",
  shoulders_front: "shoulders",
  shoulders_side: "shoulders",
  shoulders_rear: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "forearms",
  glutes: "hips",
  hip_flexors: "hips",
  adductors: "hips",
  abductors: "hips",
  quads: "thighs",
  hamstrings: "thighs",
  calves: "calves",
};

export function regionsForMuscles(muscles: string[]): GlowRegion[] {
  const regions = new Set<GlowRegion>();
  for (const m of muscles) {
    const region = MUSCLE_TO_REGION[m];
    if (region) regions.add(region);
  }
  return [...regions];
}

const ALL_REGIONS: GlowRegion[] = ["torso", "shoulders", "arms", "forearms", "hips", "thighs", "calves"];

/** Pulses the primary regions in the app's orange accent and the secondary
 * regions in its blue accent, everything else dim — call from useFrame. */
export function applyGlow(
  rig: HumanoidRig,
  primaryRegions: GlowRegion[],
  secondaryRegions: GlowRegion[],
  elapsedSeconds: number
) {
  const pulse = 0.35 + 0.35 * ((1 - Math.cos(elapsedSeconds * Math.PI * 1.6)) / 2);
  for (const region of ALL_REGIONS) {
    const mat = rig.materials[region];
    if (primaryRegions.includes(region)) {
      mat.emissive.set(0xe11d1d);
      mat.emissiveIntensity = pulse;
    } else if (secondaryRegions.includes(region)) {
      mat.emissive.set(0x2dd4bf);
      mat.emissiveIntensity = pulse * 0.75;
    } else {
      mat.emissiveIntensity = 0;
    }
  }
}
