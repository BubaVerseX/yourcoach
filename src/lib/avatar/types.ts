export type AvatarSex = "male" | "female";

/**
 * The four inputs that drive the procedural goal-visualization avatar.
 * `muscle`/`fat` are independent 0-100 sliders, not opposite ends of one
 * dial — someone can be high on both (a bulky offseason look) or low on
 * both (a lean, untrained look).
 */
export type AvatarParams = {
  sex: AvatarSex;
  heightCm: number;
  muscle: number;
  fat: number;
};

export const AVATAR_HEIGHT_RANGE = { min: 150, max: 205 } as const;

export const DEFAULT_AVATAR_PARAMS: AvatarParams = {
  sex: "male",
  heightCm: 175,
  muscle: 35,
  fat: 25,
};

export function clampAvatarParams(params: Partial<AvatarParams>): AvatarParams {
  return {
    sex: params.sex === "female" ? "female" : "male",
    heightCm: Math.min(
      AVATAR_HEIGHT_RANGE.max,
      Math.max(AVATAR_HEIGHT_RANGE.min, params.heightCm ?? DEFAULT_AVATAR_PARAMS.heightCm)
    ),
    muscle: Math.min(100, Math.max(0, params.muscle ?? DEFAULT_AVATAR_PARAMS.muscle)),
    fat: Math.min(100, Math.max(0, params.fat ?? DEFAULT_AVATAR_PARAMS.fat)),
  };
}

export function isAvatarParams(value: unknown): value is AvatarParams {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    (v.sex === "male" || v.sex === "female") &&
    typeof v.heightCm === "number" &&
    typeof v.muscle === "number" &&
    typeof v.fat === "number"
  );
}
