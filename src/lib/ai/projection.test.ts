// Formula-fallback milestones (buildFormulaMilestones) must always produce
// grounded content when the AI call is unavailable — see ensureAiPlan's
// formula-fallback branch, which previously left milestones empty and hid
// the "Projected timeline" card for every non-AI user (Phase 0 QA finding).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFormulaMilestones, computeWeightProjection } from "./projection.ts";

test("produces grounded, non-empty milestones for a weight-change goal", () => {
  const { weeklyDeltaKg, series } = computeWeightProjection(80, 2200, 2600, 12);
  const milestones = buildFormulaMilestones(series, weeklyDeltaKg, "en");

  assert.ok(milestones.length > 0);
  for (const m of milestones) {
    assert.match(m.weekLabel, /^W\d+$/);
    assert.match(m.text, /^By week \d+, you're on track to reach [\d.]+ kg\.$/);
  }
});

test("uses maintenance phrasing when the weekly delta is ~0", () => {
  const { weeklyDeltaKg, series } = computeWeightProjection(80, 2500, 2500, 12);
  const milestones = buildFormulaMilestones(series, weeklyDeltaKg, "en");

  assert.ok(milestones.length > 0);
  for (const m of milestones) {
    assert.match(m.text, /you'll have held steady on your maintenance plan\.$/);
  }
});

test("localizes into Georgian", () => {
  const { weeklyDeltaKg, series } = computeWeightProjection(80, 2200, 2600, 12);
  const milestones = buildFormulaMilestones(series, weeklyDeltaKg, "ka");

  assert.ok(milestones.length > 0);
  assert.ok(milestones.every((m) => /კგ-ს\.$/.test(m.text)));
});

test("returns nothing for a zero-length horizon", () => {
  const milestones = buildFormulaMilestones([{ week: 0, weightKg: 80 }], 0, "en");
  assert.deepEqual(milestones, []);
});
