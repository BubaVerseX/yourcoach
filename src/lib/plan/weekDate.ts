import { DAYS_OF_WEEK, type DayKey } from "./mealPlan";

/**
 * Monday of the current week, formatted as YYYY-MM-DD. Computed entirely in
 * UTC (not local time) so this returns the same calendar day regardless of
 * server/browser timezone — matching every other "today" computed elsewhere
 * in the app via `new Date().toISOString().slice(0, 10)`. Using local-time
 * getters here would shift the boundary by a day for any timezone ahead of
 * UTC (e.g. Georgia, UTC+4) once local midnight crosses into UTC's prior day.
 */
export function currentWeekStart(date = new Date()): string {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // shift Sunday back to the prior Monday
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diff));
  return d.toISOString().slice(0, 10);
}

export function dayKeyForDate(date = new Date()): DayKey {
  const day = date.getUTCDay();
  return DAYS_OF_WEEK[day === 0 ? 6 : day - 1];
}

/** The calendar date (YYYY-MM-DD) for a given day-of-week within a week. */
export function dateForDay(weekStart: string, day: DayKey): string {
  const index = DAYS_OF_WEEK.indexOf(day);
  const d = new Date(`${weekStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + index);
  return d.toISOString().slice(0, 10);
}
