import * as THREE from "three";
import type { AvatarParams } from "./types";

/**
 * Procedural generic-humanoid builder. No external 3D assets — every mesh is
 * a THREE.LatheGeometry (a 2D radius-vs-height profile revolved 360°) so the
 * silhouette is a smooth surface of revolution rather than boxes/cylinders
 * bolted together. Each limb segment gets its own profile, joined at small
 * sphere "joints" so the seams don't show.
 *
 * This is a stylized generic figure, not an anatomically-exact scan — the
 * goal is a silhouette that unmistakably reads as a person and where the
 * muscle/fat sliders produce visibly different shapes, not just uniform
 * scaling.
 */

const SKIN_MALE = 0x8a6a55;
const SKIN_FEMALE = 0x9a7660;

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
  // (e.g. shoulder→crotch, shoulder→elbow, hip→knee), but a segment's local
  // y=0 always ends up at its WORLD-LOWER end once positioned (see how each
  // segment is placed: `position.set(x, anchorY - length, z)` puts local 0
  // at the lower world point). So local t (0=bottom) must sample the profile
  // in reverse (1-t) to land the "near-parent" end at the correct — usually
  // upper — side instead of mirroring the whole limb top-to-bottom.
  const vec2s: THREE.Vector2[] = [];
  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution;
    const r = Math.max(0.001, sampleProfile(points, 1 - t));
    vec2s.push(new THREE.Vector2(r, t));
  }
  return new THREE.LatheGeometry(vec2s, radialSegments);
}

function segmentMesh(
  points: ProfilePoint[],
  length: number,
  material: THREE.Material,
  opts: { ellipseZ?: number; resolution?: number } = {}
): THREE.Mesh {
  const geo = buildLathe(points, opts.resolution ?? 16);
  geo.scale(1, length, 1);
  if (opts.ellipseZ && opts.ellipseZ !== 1) geo.scale(1, 1, opts.ellipseZ);
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

export function buildHumanoid(params: AvatarParams): THREE.Group {
  const { sex, heightCm, muscle, fat } = params;
  const m = muscle / 100;
  const f = fat / 100;
  const isMale = sex === "male";

  const root = new THREE.Group();
  const skinColor = isMale ? SKIN_MALE : SKIN_FEMALE;
  const material = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.55,
    metalness: 0.05,
  });

  // Overall height (meters) drives every segment's absolute length via
  // standard head-to-height proportions, so taller/shorter changes the
  // whole rig together rather than just uniformly scaling one blob.
  const heightM = heightCm / 100;
  const headLen = heightM / 7.3;
  const neckLen = heightM * 0.03;
  const trunkLen = heightM * 0.30;
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

  // --- Torso + pelvis: one continuous lathe from shoulders to groin ---
  // The last point tapers down close to `hipSpacing` (where the two separate
  // leg meshes attach below) instead of ending at full hip width — a lathe
  // is a single surface of revolution, so if it stayed wide all the way to
  // t=1 it would read as a flat disc/shelf sitting above the legs rather
  // than a body that narrows into them.
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
  const torso = segmentMesh(torsoPoints, trunkLen, material, {
    ellipseZ: 0.78 + f * 0.16 - m * 0.03,
    resolution: 24,
  });
  torso.position.y = 0;
  root.add(torso);

  // Bridges the torso's tapered crotch point into the two separate leg
  // meshes below — smooths what would otherwise be a visible seam.
  const pelvisJoint = jointSphere(crotchR * 1.15, material);
  pelvisJoint.position.set(0, 0, 0);
  root.add(pelvisJoint);

  // --- Neck ---
  const neckR = 0.052 + m * 0.008;
  const neck = segmentMesh(
    [
      [0, neckR * 0.92],
      [1, neckR],
    ],
    neckLen,
    material
  );
  neck.position.y = trunkLen;
  root.add(neck);

  // --- Head (ellipsoid) ---
  const headGeo = new THREE.SphereGeometry(headLen * 0.52, 20, 16);
  headGeo.scale(0.86, 1, 0.92);
  const head = new THREE.Mesh(headGeo, material);
  head.castShadow = true;
  head.position.y = trunkLen + neckLen + headLen * 0.42;
  root.add(head);

  // --- Arms (mirrored left/right) ---
  const shoulderY = trunkLen * 0.93;
  for (const side of [-1, 1] as const) {
    const shoulderJoint = jointSphere(muscleShoulder * 0.42, material);
    shoulderJoint.position.set(side * (muscleShoulder * 0.7), shoulderY, 0);
    root.add(shoulderJoint);

    const upperArmPoints: ProfilePoint[] = [
      [0, armR * 1.05 + m * 0.006],
      [0.45, armR + localBump(0.45, 0.42, 0.28, m * 0.028) + broadBump(0.45, 0.5, 0.6, f * 0.02)],
      [1, armR * 0.82],
    ];
    const upperArm = segmentMesh(upperArmPoints, armUpperLen, material);
    upperArm.position.set(side * (muscleShoulder * 0.7), shoulderY - armUpperLen, 0);
    root.add(upperArm);

    const elbowJoint = jointSphere(forearmR * 1.15, material);
    elbowJoint.position.set(side * (muscleShoulder * 0.7), shoulderY - armUpperLen, 0);
    root.add(elbowJoint);

    const forearmPoints: ProfilePoint[] = [
      [0, forearmR * 1.08 + localBump(0, 0.12, 0.22, m * 0.018)],
      [0.4, forearmR + localBump(0.4, 0.18, 0.25, m * 0.02)],
      [1, forearmR * 0.62],
    ];
    const forearm = segmentMesh(forearmPoints, armLowerLen, material);
    forearm.position.set(side * (muscleShoulder * 0.7), shoulderY - armUpperLen - armLowerLen, 0);
    root.add(forearm);

    const handGeo = new THREE.SphereGeometry(forearmR * 0.75, 12, 10);
    handGeo.scale(0.62, 1.35, 0.42);
    const hand = new THREE.Mesh(handGeo, material);
    hand.castShadow = true;
    hand.position.set(
      side * (muscleShoulder * 0.7),
      shoulderY - armUpperLen - armLowerLen - forearmR * 0.9,
      0
    );
    root.add(hand);
  }

  // --- Legs (mirrored left/right) ---
  const hipY = 0;
  for (const side of [-1, 1] as const) {
    const hipJoint = jointSphere(thighR * 0.55, material);
    hipJoint.position.set(side * hipSpacing, hipY, 0);
    root.add(hipJoint);

    const thighPoints: ProfilePoint[] = [
      [0, thighR * 1.12 + f * 0.02],
      [0.4, thighR + localBump(0.4, 0.4, 0.3, m * 0.032) + broadBump(0.4, 0.45, 0.55, f * 0.03)],
      [1, thighR * 0.68],
    ];
    const thigh = segmentMesh(thighPoints, legUpperLen, material, { ellipseZ: 1.06 });
    thigh.position.set(side * hipSpacing, hipY - legUpperLen, 0);
    root.add(thigh);

    const kneeJoint = jointSphere(calfR * 1.05, material);
    kneeJoint.position.set(side * hipSpacing, hipY - legUpperLen, 0);
    root.add(kneeJoint);

    const calfPoints: ProfilePoint[] = [
      [0, calfR * 1.1],
      [0.38, calfR + localBump(0.38, 0.38, 0.26, m * 0.026)],
      [1, calfR * 0.48],
    ];
    const calf = segmentMesh(calfPoints, legLowerLen, material);
    calf.position.set(side * hipSpacing, hipY - legUpperLen - legLowerLen, 0);
    root.add(calf);

    const footGeo = new THREE.BoxGeometry(calfR * 1.1, calfR * 0.55, calfR * 2.4, 2, 2, 2);
    const footMat = material;
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.castShadow = true;
    foot.position.set(
      side * hipSpacing,
      hipY - legUpperLen - legLowerLen - calfR * 0.6,
      calfR * 0.9
    );
    root.add(foot);
  }

  // Recenter so the figure's vertical midpoint sits near the group origin —
  // simplifies camera framing regardless of height.
  const totalTop = trunkLen + neckLen + headLen;
  const totalBottom = -(legUpperLen + legLowerLen + calfR);
  const midY = (totalTop + totalBottom) / 2;
  root.position.y = -midY;

  return root;
}
