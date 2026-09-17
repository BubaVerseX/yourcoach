import { test } from "node:test";
import assert from "node:assert/strict";
import { computeAdherence } from "./adherence.ts";

const weekStart = "2026-08-17"; // a Monday

test("no plan yet means no data, never a fabricated percentage", () => {
  const result = computeAdherence(null, null, weekStart, "2026-08-17", { mealLogs: [], workoutLogs: [] });
  assert.equal(result.hasData, false);
  assert.equal(result.percent, null);
});

test("nothing logged on an elapsed day counts as expected but not logged", () => {
  const mealPlanDays = {
    monday: { breakfast: "r1", lunch: "r2", dinner: "r3", snacks: [], totalCalories: 0 },
  } as never;
  const result = computeAdherence(mealPlanDays, null, weekStart, "2026-08-17", {
    mealLogs: [],
    workoutLogs: [],
  });
  assert.equal(result.mealsExpected, 3);
  assert.equal(result.mealsLogged, 0);
  assert.equal(result.percent, 0);
  assert.equal(result.hasData, true);
});

test("only counts days up to and including todayDate, never a future day", () => {
  const mealPlanDays = {
    monday: { breakfast: "r1", lunch: null, dinner: null, snacks: [], totalCalories: 0 },
    tuesday: { breakfast: "r1", lunch: null, dinner: null, snacks: [], totalCalories: 0 },
  } as never;
  const result = computeAdherence(mealPlanDays, null, weekStart, "2026-08-17", {
    mealLogs: [{ date: "2026-08-17", slot: "breakfast" }],
    workoutLogs: [],
  });
  // tuesday (08-18) hasn't happened yet relative to todayDate, so it's excluded
  assert.equal(result.mealsExpected, 1);
  assert.equal(result.mealsLogged, 1);
  assert.equal(result.percent, 100);
});

test("blends meals and workouts into one real percentage", () => {
  const mealPlanDays = {
    monday: { breakfast: "r1", lunch: "r2", dinner: null, snacks: [], totalCalories: 0 },
  } as never;
  const workoutPlanDays = {
    monday: { type: "workout", focus: "full_body", exercises: [] },
  } as never;
  const result = computeAdherence(mealPlanDays, workoutPlanDays, weekStart, "2026-08-17", {
    mealLogs: [{ date: "2026-08-17", slot: "breakfast" }],
    workoutLogs: [{ date: "2026-08-17", workout_completed: true }],
  });
  // 2 meals expected + 1 workout expected = 3; 1 meal logged + 1 workout completed = 2
  assert.equal(result.mealsExpected, 2);
  assert.equal(result.workoutsExpected, 1);
  assert.equal(result.percent, 67);
});

test("a rest day contributes no expected workout", () => {
  const workoutPlanDays = {
    monday: { type: "rest" },
  } as never;
  const result = computeAdherence(null, workoutPlanDays, weekStart, "2026-08-17", {
    mealLogs: [],
    workoutLogs: [],
  });
  assert.equal(result.workoutsExpected, 0);
  assert.equal(result.hasData, false);
});
