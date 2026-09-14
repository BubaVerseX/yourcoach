import * as THREE from "three";
import type { AvatarParams } from "./types";

/**
 * Procedural generic-humanoid builder. No external 3D assets — every mesh is
 * a THREE.LatheGeometry (a 2D radius-vs-height profile revolved 360°) so the
 * silhouette is a smooth surface of revolution rather than boxes/cylinders
 * bolted together.
 *
 * Unlike the original static build, every segment hangs off a proper
 * Object3D joint hierarchy (spine → shoulders → elbows, pelvis → hips →
 * knees) instead of being positioned at fixed absolute coordinates. At rest
 * (identity rotation on every joint) this produces the exact same pose as
 * before — the hierarchy only matters once something animates a joint's
 * rotation (see lib/avatar/animation.ts), which is impossible with flat
 * absolute positioning since child segments wouldn't follow a rotated
 * parent.
 *
 * This is a stylized generic figure, not an anatomically-exact scan — the
 * goal is a silhouette that unmistakably reads as a person and where the
 * muscle/fat sliders produce visibly different shapes, not just uniform
 * scaling.
 */

const SKIN_MALE = 0x8a6a55;
const SKIN_FEMALE = 0x9a7660;

export type GlowRegion = "torso" | "shoulders" | "arms" | "forearms" | "hips" | "thighs" | "calves";

export type HumanoidRig = {
  group: THREE.Group;
  joints: {
    spine: THREE.Object3D;
    hips: { left: THREE.Object3D; right: THREE.Object3D };
    knees: { left: THREE.Object3D; right: THREE.Object3D };
    shoulders: { left: THREE.Object3D; right: THREE.Object3D };
    elbows: { left: THREE.Object3D; right: THREE.Object3D };
  };
  materials: Record<GlowRegion, THREE.MeshStandardMaterial>;
};

type ProfilePoint = [t: number, radius: number];

/** Smoothly interpolates a radius profile (t in 0..1) through control points,
 * using smoothstep blending between neighbors so the surface has no sharp
 * kinks at each authored point. */
function sampleProfile(points: ProfilePoint[], t: number): number {
  const sorted = points;
  if (t <= sorted[0][0]) return sorted[0][1];
  if (t >= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1];
  for (let i = 0; i < sorted.length - 1; i++) {
    const [t0, r0] = sorted[i];
    const [t1, r1] = sorted[i + 1];
    if (t >= t0 && t <= t1) {
      const local = (t - t0) / (t1 - t0 || 1);
      const eased = local * local * (3 - 2 * local); // smoothstep
      return r0 + (r1 - r0) * eased;
    }
  }
  return sorted[sorted.length - 1][1];
}

/** Gaussian-ish bump centered at `center` (t in 0..1), for localized muscle
 * bellies (bicep, quad, calf, deltoid...) — sharp and narrow, unlike fat's
 * broad spread (see `broadBump`). */
function localBump(t: number, center: number, width: number, amount: number): number {
  const d = (t - center) / width;
  return amount * Math.exp(-d * d * 4);
}

/** Wide, soft bump for fat distribution — spans most of the segment instead
 * of a narrow belly, which is what visually distinguishes "soft and broad"
 * from muscle's "sharp and localized". */
function broadBump(t: number, center: number, width: number, amount: number): number {
  const d = (t - center) / width;
  return amount * Math.exp(-d * d * 1.1);
}

function buildLathe(
  points: ProfilePoint[],
  resolution: number,
  radialSegments = 20
): THREE.LatheGeometry {
  // Every profile below is authored "near-parent-joint first, far end last"
  // (e.g. shoulder→crotch, shoulder→elbow, hip→knee); loop-t (0=local
  // bottom) samples the profile in reverse (1-t) so the "near-parent" end
  // lands at local y=length (top) — see limbMesh for how that then gets
  // oriented to hang below or grow above its joint.
  const vec2s: THREE.Vector2[] = [];
  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution;
    const r = Math.max(0.001, sampleProfile(points, 1 - t));
    vec2s.push(new THREE.Vector2(r, t));
  }
  return new THREE.LatheGeometry(vec2s, radialSegments);
}

/** Builds a limb/torso segment mesh whose local origin is its PARENT-joint
 * end. `direction: "up"` leaves the geometry spanning y:[0,length] (grows
 * upward from the joint — torso, neck); `direction: "down"` translates it to
 * span y:[-length,0] (hangs downward from the joint — arms, legs), so a
 * child joint positioned at y:-length sits exactly at the segment's far end
 * regardless of how the parent joint is currently rotated. */
function limbMesh(
  points: ProfilePoint[],
  length: number,
  material: THREE.Material,
  direction: "up" | "down",
  opts: { ellipseZ?: number; resolution?: number } = {}
): THREE.Mesh {
  const geo = buildLathe(points, opts.resolution ?? 16);
  geo.scale(1, length, 1);
  if (opts.ellipseZ && opts.ellipseZ !== 1) geo.scale(1, 1, opts.ellipseZ);
  if (direction === "down") geo.translate(0, -length, 0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function jointSphere(radius: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
  mesh.castShadow = true;
  return mesh;
}

function glowMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.05,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
}

export function buildHumanoid(params: AvatarParams): HumanoidRig {
  const { sex, heightCm, muscle, fat } = params;
  const m = muscle / 100;
  const f = fat / 100;
  const isMale = sex === "male";

  const root = new THREE.Group();
  const skinColor = isMale ? SKIN_MALE : SKIN_FEMALE;
  const baseMat = glowMaterial(skinColor);

  // Each glowable body region gets its own material instance (even though
  // several currently share the same base skin tone) so the animation/glow
  // layer can set emissive color+intensity per region without touching the
  // rest of the body.
  const materials: Record<GlowRegion, THREE.MeshStandardMaterial> = {
    torso: glowMaterial(skinColor),
    shoulders: glowMaterial(skinColor),
    arms: glowMaterial(skinColor),
    forearms: glowMaterial(skinColor),
    hips: glowMaterial(skinColor),
    thighs: glowMaterial(skinColor),
    calves: glowMaterial(skinColor),
  };

  // Overall height (meters) drives every segment's absolute length via
  // standard head-to-height proportions, so taller/shorter changes the
  // whole rig together rather than just uniformly scaling one blob.
  const heightM = heightCm / 100;
  const headLen = heightM / 7.3;
  const neckLen = heightM * 0.03;
  const trunkLen = heightM * 0.3;
  const armUpperLen = heightM * 0.175;
  const armLowerLen = heightM * 0.15;
  const legUpperLen = heightM * 0.25;
  const legLowerLen = heightM * 0.24;

  // Base widths (radius, meters) before sex/muscle/fat modifiers.
  const shoulderR = 0.19 * (isMale ? 1.08 : 0.92);
  const chestR = 0.16 * (isMale ? 1.04 : 0.98);
  const waistR = 0.115 * (isMale ? 0.98 : 0.92);
  const hipR = 0.155 * (isMale ? 0.94 : 1.08);
  const armR = 0.045;
  const forearmR = 0.037;
  const thighR = 0.1;
  const calfR = 0.06;

  // Muscle: sharp, localized bulges + a slight waist taper (V-shape).
  // Fat: broad, soft bulges concentrated at the waist/hip/upper limbs, plus
  // a deeper (front-back) belly via ellipseZ rather than just wider.
  const muscleShoulder = shoulderR + m * 0.045;
  const muscleChest = chestR + m * 0.05;
  const waistTaper = waistR - m * 0.012 + f * 0.075;
  const muscleHip = hipR + m * 0.015 + f * 0.05;
  const hipSpacing = muscleHip * 0.55;

  // --- Pelvis: root anchor for both legs and the independently-rotating
  // spine (a squat bends the legs at the hip/knee while a hinge leans the
  // spine — they need separate pivots even though both start at the pelvis).
  const pelvis = new THREE.Object3D();
  root.add(pelvis);
  const spine = new THREE.Object3D();
  pelvis.add(spine);

  // --- Torso: one continuous lathe from crotch to shoulders, growing
  // upward from the spine pivot. The last point tapers down close to
  // `hipSpacing` (where the two separate leg meshes attach below) instead of
  // ending at full hip width — a lathe is a single surface of revolution, so
  // if it stayed wide all the way to t=1 it would read as a flat disc/shelf
  // sitting above the legs rather than a body that narrows into them.
  const hipPeak = muscleHip * 0.92;
  const crotchR = hipSpacing * 0.82;
  const torsoPoints: ProfilePoint[] = [
    [0.0, muscleShoulder * 0.82],
    [0.06, muscleShoulder * 0.95],
    [0.14, muscleShoulder],
    [0.26, muscleChest + localBump(0.26, 0.26, 0.14, m * 0.02) + (isMale ? 0 : 0.012)],
    [0.48, waistTaper + broadBump(0.48, 0.58, 0.4, f * 0.05)],
    [0.6, waistTaper + broadBump(0.6, 0.58, 0.4, f * 0.055)],
    [0.72, (waistTaper + hipPeak) / 2 + broadBump(0.72, 0.58, 0.4, f * 0.05)],
    [0.84, hipPeak],
    [0.94, hipPeak * 0.7],
    [1.0, crotchR],
  ];
  const torso = limbMesh(torsoPoints, trunkLen, materials.torso, "up", {
    ellipseZ: 0.78 + f * 0.16 - m * 0.03,
    resolution: 24,
  });
  spine.add(torso);

  // Bridges the torso's tapered crotch point into the two separate leg
  // meshes below — smooths what would otherwise be a visible seam.
  const pelvisJoint = jointSphere(crotchR * 1.15, materials.hips);
  spine.add(pelvisJoint);

  // --- Neck + head, children of a pivot at the top of the torso ---
  const neckPivot = new THREE.Object3D();
  neckPivot.position.set(0, trunkLen, 0);
  spine.add(neckPivot);

  const neckR = 0.052 + m * 0.008;
  const neck = limbMesh(
    [
      [0, neckR * 0.92],
      [1, neckR],
    ],
    neckLen,
    baseMat,
    "up"
  );
  neckPivot.add(neck);

  const headGeo = new THREE.SphereGeometry(headLen * 0.52, 20, 16);
  headGeo.scale(0.86, 1, 0.92);
  const head = new THREE.Mesh(headGeo, baseMat);
  head.castShadow = true;
  head.position.y = neckLen + headLen * 0.42;
  neckPivot.add(head);

  // --- Arms (mirrored left/right), children of shoulder pivots on the spine ---
  const shoulderY = trunkLen * 0.93;
  const shoulders = { left: new THREE.Object3D(), right: new THREE.Object3D() };
  const elbows = { left: new THREE.Object3D(), right: new THREE.Object3D() };

  for (const side of [-1, 1] as const) {
    const shoulderPivot = side === -1 ? shoulders.left : shoulders.right;
    shoulderPivot.position.set(side * (muscleShoulder * 0.7), shoulderY, 0);
    spine.add(shoulderPivot);

    const shoulderJoint = jointSphere(muscleShoulder * 0.42, materials.shoulders);
    shoulderPivot.add(shoulderJoint);

    const upperArmPoints: ProfilePoint[] = [
      [0, armR * 1.05 + m * 0.006],
      [0.45, armR + localBump(0.45, 0.42, 0.28, m * 0.028) + broadBump(0.45, 0.5, 0.6, f * 0.02)],
      [1, armR * 0.82],
    ];
    const upperArm = limbMesh(upperArmPoints, armUpperLen, materials.arms, "down");
    shoulderPivot.add(upperArm);

    const elbowPivot = side === -1 ? elbows.left : elbows.right;
    elbowPivot.position.set(0, -armUpperLen, 0);
    shoulderPivot.add(elbowPivot);

    const elbowJoint = jointSphere(forearmR * 1.15, materials.arms);
    elbowPivot.add(elbowJoint);

    const forearmPoints: ProfilePoint[] = [
      [0, forearmR * 1.08 + localBump(0, 0.12, 0.22, m * 0.018)],
      [0.4, forearmR + localBump(0.4, 0.18, 0.25, m * 0.02)],
      [1, forearmR * 0.62],
    ];
    const forearm = limbMesh(forearmPoints, armLowerLen, materials.forearms, "down");
    elbowPivot.add(forearm);

    const handGeo = new THREE.SphereGeometry(forearmR * 0.75, 12, 10);
    handGeo.scale(0.62, 1.35, 0.42);
    const hand = new THREE.Mesh(handGeo, materials.forearms);
    hand.castShadow = true;
    hand.position.set(0, -armLowerLen - forearmR * 0.9, 0);
    elbowPivot.add(hand);
  }

  // --- Legs (mirrored left/right), children of hip pivots on the pelvis ---
  const hips = { left: new THREE.Object3D(), right: new THREE.Object3D() };
  const knees = { left: new THREE.Object3D(), right: new THREE.Object3D() };

  for (const side of [-1, 1] as const) {
    const hipPivot = side === -1 ? hips.left : hips.right;
    hipPivot.position.set(side * hipSpacing, 0, 0);
    pelvis.add(hipPivot);

    const hipJoint = jointSphere(thighR * 0.55, materials.hips);
    hipPivot.add(hipJoint);

    const thighPoints: ProfilePoint[] = [
      [0, thighR * 1.12 + f * 0.02],
      [0.4, thighR + localBump(0.4, 0.4, 0.3, m * 0.032) + broadBump(0.4, 0.45, 0.55, f * 0.03)],
      [1, thighR * 0.68],
    ];
    const thigh = limbMesh(thighPoints, legUpperLen, materials.thighs, "down", { ellipseZ: 1.06 });
    hipPivot.add(thigh);

    const kneePivot = side === -1 ? knees.left : knees.right;
    kneePivot.position.set(0, -legUpperLen, 0);
    hipPivot.add(kneePivot);

    const kneeJoint = jointSphere(calfR * 1.05, materials.thighs);
    kneePivot.add(kneeJoint);

    const calfPoints: ProfilePoint[] = [
      [0, calfR * 1.1],
      [0.38, calfR + localBump(0.38, 0.38, 0.26, m * 0.026)],
      [1, calfR * 0.48],
    ];
    const calf = limbMesh(calfPoints, legLowerLen, materials.calves, "down");
    kneePivot.add(calf);

    const footGeo = new THREE.BoxGeometry(calfR * 1.1, calfR * 0.55, calfR * 2.4, 2, 2, 2);
    const foot = new THREE.Mesh(footGeo, materials.calves);
    foot.castShadow = true;
    foot.position.set(0, -legLowerLen - calfR * 0.6, calfR * 0.9);
    kneePivot.add(foot);
  }

  // Recenter so the figure's vertical midpoint sits near the group origin —
  // simplifies camera framing regardless of height. Valid at rest pose
  // (every joint at identity rotation), which is the pose the viewer opens
  // on before any animation loop starts.
  const totalTop = trunkLen + neckLen + headLen;
  const totalBottom = -(legUpperLen + legLowerLen + calfR);
  const midY = (totalTop + totalBottom) / 2;
  root.position.y = -midY;

  return {
    group: root,
    joints: { spine, hips, knees, shoulders, elbows },
    materials,
  };
}
