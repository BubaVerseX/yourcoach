import Link from "next/link";
import { Flame, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { format } from "@/lib/i18n/format";
import { currentWeekStart, dayKeyForDate } from "@/lib/plan/generatePlan";
import { getOrCreateWeekPlans } from "@/lib/plan/getWeekPlans";
import { DAYS_OF_WEEK } from "@/lib/plan/mealPlan";
import { getRecipesByIds, mealIdsFromDay } from "@/lib/plan/lookups";
import { localizedField } from "@/lib/plan/localized";
import { dayLabel } from "@/lib/plan/dayLabel";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaywallLock } from "@/components/PaywallLock";

export default async function MealsPage() {
  const supabase = await createClient();
  const { t, locale } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = currentWeekStart();
  const todayKey = dayKeyForDate();
  const { mealPlan, isEphemeral } = await getOrCreateWeekPlans(user.id, weekStart);

  if (!mealPlan) {
    return (
      <div className="py-10">
        <EmptyState icon={Flame} title={t.meals.emptyTitle} description={t.meals.emptyBody} />
      </div>
    );
  }

  const allIds = DAYS_OF_WEEK.flatMap((day) => mealIdsFromDay(mealPlan.planData.days[day]));
  const recipeMap = await getRecipesByIds(allIds);

  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{t.meals.title}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {format(t.meals.weekOf, { date: weekStart })}
        </p>
      </div>

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

      {isEphemeral ? (
        <PaywallLock>
          <Card className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold">
              <ShoppingCart strokeWidth={1.8} className="h-4 w-4 text-[var(--color-accent)]" />
              {t.meals.groceryList}
            </span>
          </Card>
        </PaywallLock>
      ) : (
        <Link href="/meals/grocery">
          <Card className="flex items-center justify-between transition-all hover:translate-y-[-1px]">
            <span className="flex items-center gap-2 text-sm font-bold">
              <ShoppingCart strokeWidth={1.8} className="h-4 w-4 text-[var(--color-accent)]" />
              {t.meals.groceryList}
            </span>
          </Card>
        </Link>
      )}

      <div className="flex flex-col gap-3">
        {DAYS_OF_WEEK.map((day) => {
          const dayPlan = mealPlan.planData.days[day];
          const ids = mealIdsFromDay(dayPlan);
          const names = ids
            .map((id) => recipeMap.get(id))
            .filter(Boolean)
            .map((r) => localizedField(r!, "name", "name_ka", locale));

          const card = (
            <Card className="flex items-center justify-between transition-all hover:translate-y-[-1px]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    {dayLabel(day, t)}
                  </span>
                  {day === todayKey && (
                    <span className="soft-raised rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase text-[var(--color-accent)]">
                      {t.common.today}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {names.join(" · ")}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-[var(--color-accent)]">
                <Flame strokeWidth={1.8} className="h-4 w-4" />
                {dayPlan.totalCalories}
              </div>
            </Card>
          );

          if (isEphemeral && day !== todayKey) {
            return <PaywallLock key={day}>{card}</PaywallLock>;
          }
          return (
            <Link key={day} href={`/meals/${day}`} className="relative block">
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

