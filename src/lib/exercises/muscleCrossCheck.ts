/**
 * Maps WorkoutX's muscle vocabulary (target/secondaryMuscles strings) to the
 * app's own lowercase taxonomy (see migration 0008_v4_1_muscle_groups.sql).
 * WorkoutX's vocabulary is coarser in places (e.g. one generic "shoulders"
 * where the app splits front/side/rear), so each entry maps to the *set* of
 * app groups that WorkoutX term could plausibly mean — a match against any
 * one of them counts as covered.
 */
const WORKOUTX_TO_APP_GROUPS: Record<string, string[]> = {
  abs: ["core"],
  abdominals: ["core"],
  abductors: ["abductors"],
  adductors: ["adductors"],
  biceps: ["biceps"],
  calves: ["calves"],
  delts: ["shoulders_front", "shoulders_side", "shoulders_rear"],
  shoulders: ["shoulders_front", "shoulders_side", "shoulders_rear"],
  forearms: ["forearms"],
  glutes: ["glutes"],
  hamstrings: ["hamstrings"],
  lats: ["lats"],
  pectorals: ["chest"],
  chest: ["chest"],
  quads: ["quads"],
  quadriceps: ["quads"],
  traps: ["trapezius"],
  trapezius: ["trapezius"],
  triceps: ["triceps"],
  "upper back": ["back_upper", "rhomboids", "trapezius", "lats"],
  "lower back": ["back_lower"],
  spine: ["back_lower"],
  rhomboids: ["rhomboids"],
  "hip flexors": ["hip_flexors"],
};

export type MuscleMismatch = {
  workoutXMuscle: string;
  possibleAppGroups: string[];
};

/**
 * Compares WorkoutX's reported target + secondaryMuscles against this
 * exercise's existing primary_muscles/secondary_muscles. Returns the list of
 * WorkoutX muscles that don't overlap with anything already tagged — signal
 * to flag for human review, never applied automatically (existing muscle
 * data is never overwritten by this).
 */
export function findMuscleMismatches(
  workoutXTarget: string,
  workoutXSecondaryMuscles: string[],
  existingPrimary: string[],
  existingSecondary: string[]
): MuscleMismatch[] {
  const existing = new Set([...existingPrimary, ...existingSecondary]);
  const mismatches: MuscleMismatch[] = [];

  for (const raw of [workoutXTarget, ...workoutXSecondaryMuscles]) {
    if (!raw) continue;
    const key = raw.toLowerCase().trim();
    const possibleAppGroups = WORKOUTX_TO_APP_GROUPS[key];
    if (!possibleAppGroups) continue; // unmapped vocabulary — not enough signal to flag
    const covered = possibleAppGroups.some((g) => existing.has(g));
    if (!covered) mismatches.push({ workoutXMuscle: raw, possibleAppGroups });
  }

  return mismatches;
}
