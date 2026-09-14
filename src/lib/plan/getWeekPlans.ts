import { createClient } from "@/lib/supabase/server";
import { generatePlan, generateEphemeralPlan } from "./generatePlan";
import { requireActivePremium } from "@/lib/premium/requireActivePremium";
import type { MealPlanData } from "./mealPlan";
import type { WorkoutPlanData } from "./workoutPlan";
import type { MacroTargets } from "./nutrition";

export type WeekPlans = {
  mealPlan: { calorieTarget: number; macros: MacroTargets; planData: MealPlanData } | null;
  workoutPlan: { setting: string; planData: WorkoutPlanData } | null;
  /** True when this plan is a free-tier preview generated on the fly and
   * never persisted — every mutation (swap, log, complete) will fail, and
   * the plan starts fresh again on the next visit. The UI should say so. */
  isEphemeral?: boolean;
};

/** Fetches this week's plans, generating them on the fly if they don't exist
 * yet. Premium users get a persisted plan (see generatePlan); free users get
 * a fresh, unsaved preview every time (see generateEphemeralPlan) — this is
 * the v2.0 premium gate applied at the data-access layer. */
export async function getOrCreateWeekPlans(userId: string, weekStart: string): Promise<WeekPlans> {
  const supabase = await createClient();

  const [{ data: mealRow }, { data: workoutRow }] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle(),
  ]);

  // KNOWN ISSUE (Phase 0 QA, not fixed here): this short-circuits before ever
  // calling ensureAiPlan/generatePlan once a week's rows exist, so a profile
  // edit mid-week never triggers regeneration until the next fresh week.
  if (mealRow && workoutRow) {
    return {
      mealPlan: {
        calorieTarget: mealRow.daily_calorie_target,
        macros: mealRow.macro_targets as unknown as MacroTargets,
        planData: mealRow.plan_data as unknown as MealPlanData,
      },
      workoutPlan: {
        setting: workoutRow.setting,
        planData: workoutRow.plan_data as unknown as WorkoutPlanData,
      },
    };
  }

  const premium = await requireActivePremium(userId);

  if (premium) {
    const generated = await generatePlan(userId, weekStart);
    if (!generated) return { mealPlan: null, workoutPlan: null };
    return {
      mealPlan: generated.mealPlan,
      workoutPlan: { setting: generated.workoutPlan.setting, planData: generated.workoutPlan.planData },
    };
  }

  const ephemeral = await generateEphemeralPlan(userId, weekStart);
  if (!ephemeral) return { mealPlan: null, workoutPlan: null };
  return {
    mealPlan: ephemeral.mealPlan,
    workoutPlan: { setting: ephemeral.workoutPlan.setting, planData: ephemeral.workoutPlan.planData },
    isEphemeral: true,
  };
}
