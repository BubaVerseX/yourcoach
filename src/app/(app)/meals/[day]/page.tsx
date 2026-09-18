import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Clock, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { format } from "@/lib/i18n/format";
import { currentWeekStart } from "@/lib/plan/generatePlan";
import { dateForDay, dayKeyForDate } from "@/lib/plan/weekDate";
import { getOrCreateWeekPlans } from "@/lib/plan/getWeekPlans";
import { DAYS_OF_WEEK, portionFor, type DayKey } from "@/lib/plan/mealPlan";
import { getRecipesByIds, mealIdsFromDay } from "@/lib/plan/lookups";
import { localizedField } from "@/lib/plan/localized";
import { parseIngredients } from "@/lib/plan/ingredients";
import { getFavoriteIds } from "@/lib/actions/favorites";
import type { MealLogStatus } from "@/lib/actions/mealFriction";
import { FavoriteButton } from "@/components/FavoriteButton";
import { GeorgianRibbonBadge } from "@/components/ui/GeorgianRibbonBadge";
import { MealSwapPanel } from "@/components/MealSwapPanel";
import { MealMainSlotControls } from "@/components/MealMainSlotControls";
import { MealTimeTabs } from "@/components/MealTimeTabs";
import { PaywallLockCard } from "@/components/PaywallLock";
import type { MealSlot } from "@/lib/actions/swap";

const MEAL_TYPE_ORDER = ["breakfast", "lunch", "dinner"] as const;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export default async function MealDayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  if (!DAYS_OF_WEEK.includes(day as DayKey)) notFound();
  const dayKey = day as DayKey;

  const supabase = await createClient();
  const { t, locale } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = currentWeekStart();
  const { mealPlan, isEphemeral } = await getOrCreateWeekPlans(user.id, weekStart);
  if (!mealPlan) notFound();

  // Without a subscription, only today's day view is reachable at all — the
  // week list (/meals) never links to other days when ephemeral, but guard
  // direct navigation too.
  if (isEphemeral && dayKey !== dayKeyForDate()) notFound();

  const dayPlan = mealPlan.planData.days[dayKey];
  const ids = mealIdsFromDay(dayPlan);
  const date = dateForDay(weekStart, dayKey);
  const [{ data: profile }, recipeMap, favoriteIds, { data: mealLogRows }] = await Promise.all([
    supabase.from("profiles").select("created_at").eq("id", user.id).single(),
    getRecipesByIds(ids),
    getFavoriteIds(user.id, "recipe"),
    supabase.from("meal_logs").select("slot, status").eq("user_id", user.id).eq("date", date),
  ]);
  const logStatusBySlot = new Map(
    (mealLogRows ?? []).map((row) => [row.slot, row.status as MealLogStatus])
  );

  const weekNumber = profile?.created_at
    ? Math.max(1, Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / MS_PER_WEEK) + 1)
    : 1;
  const dayNumber = DAYS_OF_WEEK.indexOf(dayKey) + 1;

  type MealEntry = {
    type: (typeof MEAL_TYPE_ORDER)[number] | "snack";
    slot: MealSlot;
    recipe: NonNullable<ReturnType<typeof recipeMap.get>>;
    portion: number;
  };

  const grouped: Record<string, MealEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const type of MEAL_TYPE_ORDER) {
    const id = dayPlan[type];
    const recipe = id ? recipeMap.get(id) : undefined;
    if (recipe) grouped[type].push({ type, slot: type, recipe, portion: portionFor(dayPlan, type) });
  }
  dayPlan.snacks.forEach((id, snackIndex) => {
    const recipe = recipeMap.get(id);
    if (recipe) grouped.snack.push({ type: "snack", slot: { snackIndex }, recipe, portion: 1 });
  });

  function renderCard(entry: MealEntry, variant: "hero" | "compact") {
    const { recipe, slot, portion, type } = entry;
    const displayCalories = Math.round(recipe.calories * portion);
    const isHighProtein = recipe.calories > 0 && (recipe.protein_g * 4) / recipe.calories >= 0.3;
    const name = localizedField(recipe, "name", "name_ka", locale);
    const photo = (
      <div className={variant === "hero" ? "relative h-52 w-full shrink-0" : "relative h-28 w-28 shrink-0"}>
        {recipe.cuisine === "georgian" && <GeorgianRibbonBadge labelKa={t.meals.georgianBadge} />}
        {recipe.image_url ? (
          <Image src={recipe.image_url} alt={recipe.name} fill sizes="(min-width: 640px) 400px, 100vw" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-[var(--color-surface)]" />
        )}
      </div>
    );

    return (
      <div
        key={`${type}-${recipe.id}`}
        className={
          variant === "hero"
            ? "flex flex-col border border-[var(--color-border)] bg-[var(--color-surface)]"
            : "flex flex-row border border-[var(--color-border)] bg-[var(--color-surface)]"
        }
      >
        {photo}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[19px] font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
              {name}
            </h3>
            <FavoriteButton itemType="recipe" itemId={recipe.id} initialFavorited={favoriteIds.has(recipe.id)} />
          </div>
          <div className="text-mono-label flex flex-wrap items-center gap-2 text-[9px] text-[var(--color-text-tertiary)]">
            {locale !== "en" && <span>{recipe.name}</span>}
            <span className="flex items-center gap-1">
              <Clock strokeWidth={1.8} className="h-3 w-3" />
              {format(t.meals.prepTime, { minutes: recipe.prep_time_minutes })}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap gap-2">
            {isHighProtein && (
              <span className="text-mono-label bg-[var(--color-accent-2)] px-2 py-1 text-[9px] text-[var(--color-bg)]">
                HIGH PROTEIN
              </span>
            )}
            <span className="text-mono-label border border-[var(--color-border-strong)] px-2 py-1 text-[9px] text-[var(--color-text-primary)]">
              {displayCalories} KCAL
            </span>
          </div>

          {recipe.description && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {localizedField(recipe, "description", "description_ka", locale)}
            </p>
          )}

          <div className="mt-1 flex gap-4 text-sm">
            <span>
              <b>{Math.round(recipe.protein_g * portion)}g</b>{" "}
              <span className="text-[var(--color-text-tertiary)]">{t.meals.protein}</span>
            </span>
            <span>
              <b>{Math.round(recipe.carbs_g * portion)}g</b>{" "}
              <span className="text-[var(--color-text-tertiary)]">{t.meals.carbs}</span>
            </span>
            <span>
              <b>{Math.round(recipe.fat_g * portion)}g</b>{" "}
              <span className="text-[var(--color-text-tertiary)]">{t.meals.fat}</span>
            </span>
          </div>

          {parseIngredients(recipe.ingredients).length > 0 && (
            <div className="mt-1">
              <span className="text-mono-label text-[9px] text-[var(--color-text-tertiary)]">
                {t.meals.ingredients}
              </span>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {parseIngredients(recipe.ingredients)
                  .map((ing) => `${ing.name} (${Math.round(ing.quantity * portion * 100) / 100} ${ing.unit})`)
                  .join(", ")}
              </p>
            </div>
          )}

          {recipe.instructions && (
            <div className="mt-1">
              <span className="text-mono-label text-[9px] text-[var(--color-text-tertiary)]">
                {t.meals.instructions}
              </span>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {localizedField(recipe, "instructions", "instructions_ka", locale)}
              </p>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-2">
            <MealSwapPanel weekStart={weekStart} day={dayKey} slot={slot} />
            {typeof slot === "string" && (
              <MealMainSlotControls
                weekStart={weekStart}
                day={dayKey}
                slot={slot}
                date={date}
                currentPortion={portionFor(dayPlan, slot)}
                initialLogStatus={logStatusBySlot.get(slot) ?? null}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderGroup(entries: MealEntry[]): ReactNode {
    if (entries.length === 0) {
      return <p className="text-sm text-[var(--color-text-secondary)]">{t.meals.emptyBody}</p>;
    }
    return (
      <div className="flex flex-col gap-4">
        {entries.map((entry, i) => renderCard(entry, i === 0 ? "hero" : "compact"))}
      </div>
    );
  }

  const tabTypes: { key: keyof typeof grouped; label: string }[] = [
    { key: "breakfast", label: t.meals.breakfast },
    { key: "lunch", label: t.meals.lunch },
    { key: "dinner", label: t.meals.dinner },
    { key: "snack", label: t.meals.snack },
  ];
  const tabs = tabTypes
    .filter((tab) => grouped[tab.key].length > 0)
    .map((tab) => ({
      key: tab.key,
      label: tab.label,
      content:
        isEphemeral && tab.key !== "breakfast" ? (
          <PaywallLockCard title={t.premium.lockedBadge} body={t.premium.freePreviewBody} />
        ) : (
          renderGroup(grouped[tab.key])
        ),
    }));

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex items-center justify-between">
        <Link
          href="/meals"
          aria-label={t.meals.title}
          className="flex h-[34px] w-[34px] items-center justify-center border border-[var(--color-border-strong)] transition-colors duration-150 hover:border-white"
        >
          <ArrowLeft strokeWidth={1.8} className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-1 text-sm font-bold text-[var(--color-accent)]">
          <Flame strokeWidth={1.8} className="h-4 w-4" />
          {dayPlan.totalCalories} {t.meals.calories}
        </div>
      </div>

      <div>
        <span className="text-mono-label block text-[10px] text-[var(--color-text-tertiary)]">
          {`WEEK ${weekNumber} · DAY ${dayNumber}`}
        </span>
        <h1 className="gradient-text-signature text-[26px] font-black tracking-[-0.03em]">
          {t.meals.title}
        </h1>
      </div>

      {tabs.length > 0 ? (
        <MealTimeTabs tabs={tabs} />
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">{t.meals.emptyBody}</p>
      )}
    </div>
  );
}
