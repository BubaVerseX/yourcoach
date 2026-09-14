"use client";

import { useState } from "react";
import { Flame, Repeat } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { DAYS_OF_WEEK, type MealPlanProfileInput } from "@/lib/plan/mealPlan";
import { getMealAlternatives } from "@/lib/plan/alternatives";
import { dayLabel } from "@/lib/plan/dayLabel";
import { localizedField } from "@/lib/plan/localized";
import type { Tables } from "@/lib/supabase/database.types";
import { Card } from "@/components/ui/Card";
import { PaywallLockClient } from "@/components/PaywallLockClient";
import type { GeneratedMealPlan } from "@/lib/actions/preview";

type Recipe = Tables<"recipes">;
type Slot = "breakfast" | "lunch" | "dinner";

export function MealPreview({
  profile,
  recipes,
  mealPlan,
  unlockedDay,
  onChange,
}: {
  profile: MealPlanProfileInput;
  recipes: Recipe[];
  mealPlan: GeneratedMealPlan;
  /** The one day shown in full — everything else renders blurred behind a
   * paywall CTA instead of a fake placeholder, since it's real plan data. */
  unlockedDay: (typeof DAYS_OF_WEEK)[number];
  onChange: (next: GeneratedMealPlan) => void;
}) {
  const { t, locale } = useLocale();
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const [openSwap, setOpenSwap] = useState<string | null>(null);

  function handleSwap(day: (typeof DAYS_OF_WEEK)[number], slot: Slot, newRecipeId: string) {
    const dayPlan = { ...mealPlan.planData.days[day], [slot]: newRecipeId };
    const ids = [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner, ...dayPlan.snacks].filter(
      (id): id is string => !!id
    );
    dayPlan.totalCalories = ids.reduce((sum, id) => sum + (recipeMap.get(id)?.calories ?? 0), 0);

    onChange({
      ...mealPlan,
      planData: { days: { ...mealPlan.planData.days, [day]: dayPlan } },
    });
    setOpenSwap(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex items-center justify-around text-center">
        <div>
          <div className="text-xl font-extrabold text-[var(--color-accent)]">
            {mealPlan.calorieTarget}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)]">{t.meals.target}</div>
        </div>
        <div>
          <div className="text-xl font-extrabold">{mealPlan.macros.proteinG}g</div>
          <div className="text-xs text-[var(--color-text-tertiary)]">{t.meals.protein}</div>
        </div>
        <div>
          <div className="text-xl font-extrabold">{mealPlan.macros.carbsG}g</div>
          <div className="text-xs text-[var(--color-text-tertiary)]">{t.meals.carbs}</div>
        </div>
        <div>
          <div className="text-xl font-extrabold">{mealPlan.macros.fatG}g</div>
          <div className="text-xs text-[var(--color-text-tertiary)]">{t.meals.fat}</div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {DAYS_OF_WEEK.map((day) => {
          const dayPlan = mealPlan.planData.days[day];
          const locked = day !== unlockedDay;
          const card = (
            <Card className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {dayLabel(day, t)}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-accent)]">
                  <Flame strokeWidth={1.8} className="h-3.5 w-3.5" />
                  {dayPlan.totalCalories}
                </span>
              </div>
              {(["breakfast", "lunch", "dinner"] as Slot[]).map((slot) => {
                const recipeId = dayPlan[slot];
                const recipe = recipeId ? recipeMap.get(recipeId) : undefined;
                if (!recipe) return null;
                const key = `${day}-${slot}`;
                const isOpen = openSwap === key;

                return (
                  <div key={slot} className="soft-pressed rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">
                          {t.meals[slot]}
                        </span>
                        <span className="block truncate text-sm font-semibold">
                          {localizedField(recipe, "name", "name_ka", locale)}
                        </span>
                      </div>
                      {!locked && (
                        <button
                          type="button"
                          onClick={() => setOpenSwap(isOpen ? null : key)}
                          className="soft-raised flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-[var(--color-text-secondary)]"
                        >
                          <Repeat strokeWidth={1.8} className="h-3 w-3" />
                          {t.meals.swap}
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <div className="mt-2 flex flex-col gap-1.5 border-t border-black/[0.04] pt-2">
                        {getMealAlternatives(recipe, recipes, profile, new Set(), `${profile.id}-${day}-${slot}`).map(
                          (alt) => (
                            <button
                              key={alt.id}
                              type="button"
                              onClick={() => handleSwap(day, slot, alt.id)}
                              className="soft-raised flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold"
                            >
                              <span>{localizedField(alt, "name", "name_ka", locale)}</span>
                              <span className="text-[var(--color-text-tertiary)]">
                                {alt.calories} {t.meals.calories}
                              </span>
                            </button>
                          )
                        )}
                        {getMealAlternatives(recipe, recipes, profile, new Set(), `${profile.id}-${day}-${slot}`)
                          .length === 0 && (
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            {t.meals.swapNoOptions}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {dayPlan.snacks.length > 0 && (
                <p className="px-1 text-xs text-[var(--color-text-tertiary)]">
                  +{dayPlan.snacks.length}{" "}
                  {dayPlan.snacks
                    .map((id) => recipeMap.get(id))
                    .filter(Boolean)
                    .map((r) => localizedField(r!, "name", "name_ka", locale))
                    .join(", ")}
                </p>
              )}
            </Card>
          );
          return (
            <div key={day}>
              {locked ? <PaywallLockClient>{card}</PaywallLockClient> : card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
