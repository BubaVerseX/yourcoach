import type { Locale } from "@/lib/i18n";
import en from "@/lib/i18n/dictionaries/en";
import ka from "@/lib/i18n/dictionaries/ka";

const dictionaries = { en, ka };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://livehealthy-sepia.vercel.app";

function wrap(locale: Locale, title: string, body: string, ctaLabel: string, ctaHref: string) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #e8ecef; padding: 32px;">
    <div style="max-width: 480px; margin: 0 auto; background: #f4f6f8; border-radius: 24px; padding: 32px;">
      <h1 style="font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #141a21; margin: 0 0 12px;">${title}</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #5c6773; margin: 0 0 20px;">${body}</p>
      <a href="${ctaHref}" style="display: inline-block; background: #ff5722; color: #fff; font-weight: 700; padding: 12px 24px; border-radius: 16px; text-decoration: none; font-size: 14px;">${ctaLabel}</a>
    </div>
  </div>`;
}

export function mealReminderEmail(locale: Locale, mealNames: string[]) {
  const t = dictionaries[locale];
  const subject = `${t.home.todaysMeals} — ${t.common.appName}`;
  const body = mealNames.length
    ? mealNames.join(", ")
    : t.meals.emptyBody;
  return {
    subject,
    html: wrap(locale, t.home.todaysMeals, body, t.home.viewMealPlan, `${APP_URL}/meals`),
  };
}

export function workoutReminderEmail(locale: Locale, isRestDay: boolean, focus?: string) {
  const t = dictionaries[locale];
  const subject = `${t.home.todaysWorkout} — ${t.common.appName}`;
  const body = isRestDay
    ? t.workouts.restDayBody
    : t.workouts.muscleGroups[(focus as keyof typeof t.workouts.muscleGroups) ?? "full_body"] ?? focus ?? "";
  return {
    subject,
    html: wrap(locale, t.home.todaysWorkout, body, t.home.viewWorkoutPlan, `${APP_URL}/workouts`),
  };
}
