import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { format } from "@/lib/i18n/format";
import { currentWeekStart } from "@/lib/plan/generatePlan";
import { getOrCreateWeekPlans } from "@/lib/plan/getWeekPlans";
import { DAYS_OF_WEEK } from "@/lib/plan/mealPlan";
import { getRecipesByIds, mealIdsFromDay } from "@/lib/plan/lookups";
import { aggregateGroceryList } from "@/lib/plan/groceryList";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroceryListView } from "@/components/GroceryListView";

export default async function GroceryListPage() {
  const supabase = await createClient();
  const { t } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = currentWeekStart();
  const { mealPlan, isEphemeral } = await getOrCreateWeekPlans(user.id, weekStart);

  // Grocery checklist state is tracking, not a preview — entirely locked
  // pre-subscription. /meals already shows this link locked.
  if (isEphemeral) redirect("/meals");

  return (
    <div className="flex flex-col gap-6 py-6">
      <Link
        href="/meals"
        aria-label={t.meals.title}
        className="flex h-[34px] w-[34px] items-center justify-center border border-[var(--color-border-strong)] transition-colors duration-150 hover:border-white"
      >
        <ArrowLeft strokeWidth={1.8} className="h-4 w-4" />
      </Link>

      <div>
        <span className="text-mono-label block text-[10px] text-[var(--color-text-tertiary)]">
          {format(t.grocery.weekOf, { date: weekStart }).toUpperCase()}
        </span>
        <h1 className="text-[26px] font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
          {t.grocery.title}
        </h1>
      </div>

      {!mealPlan ? (
        <EmptyState icon={ShoppingCart} title={t.grocery.title} description={t.grocery.empty} />
      ) : (
        <GroceryListContent weekStart={weekStart} planData={mealPlan.planData} userId={user.id} />
      )}
    </div>
  );
}

async function GroceryListContent({
  weekStart,
  planData,
  userId,
}: {
  weekStart: string;
  planData: NonNullable<Awaited<ReturnType<typeof getOrCreateWeekPlans>>["mealPlan"]>["planData"];
  userId: string;
}) {
  const supabase = await createClient();

  const ids = DAYS_OF_WEEK.flatMap((day) => mealIdsFromDay(planData.days[day]));
  const recipeMap = await getRecipesByIds(ids);
  const grouped = aggregateGroceryList(planData, recipeMap);

  const { data: checkedRows } = await supabase
    .from("grocery_list_items")
    .select("ingredient_key, checked")
    .eq("user_id", userId)
    .eq("week_start", weekStart);

  const initialChecked: Record<string, boolean> = {};
  for (const row of checkedRows ?? []) {
    initialChecked[row.ingredient_key] = row.checked;
  }

  return <GroceryListView grouped={grouped} initialChecked={initialChecked} weekStart={weekStart} />;
}
