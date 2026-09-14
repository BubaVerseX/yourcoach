import type { MealPlanData } from "@/lib/plan/mealPlan";
import type { WorkoutPlanData } from "@/lib/plan/workoutPlan";
import type { MacroTargets } from "@/lib/plan/nutrition";

/**
 * Shape of a plan generated client-side during the anonymous /get-started
 * quiz. Never persisted pre-subscription — the teaser shows the real sample
 * meal from this data, everything else stays locked (see PaywallLockClient
 * usage in GetStartedFlow/MealPreview). Once subscribed, the real plan is
 * (re)computed server-side via getOrCreateWeekPlans, not copied from here.
 */
export type GeneratedMealPlan = {
  planData: MealPlanData;
  calorieTarget: number;
  macros: MacroTargets;
};

export type GeneratedWorkoutPlan = {
  planData: WorkoutPlanData;
  setting: "home" | "gym" | "both";
};
