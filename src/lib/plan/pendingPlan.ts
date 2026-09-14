"use client";

import type { OnboardingInput } from "@/app/onboarding/actions";

const STORAGE_KEY = "vellio-pending-plan";

export type PendingPlan = {
  input: OnboardingInput;
};

/**
 * Bridges the gap between "completed the intake quiz anonymously" and
 * "confirmed email and logged in" when Supabase requires email confirmation
 * (so there's no session yet at signup time to save the profile against).
 * Session-scoped only — if the user closes the tab before confirming, this
 * is simply gone and they redo the quiz, same as if they'd never started.
 *
 * Only carries the intake answers, not a generated plan — nothing about the
 * plan itself is ever persisted pre-subscription (see onboarding/actions.ts).
 */
export function savePendingPlan(plan: PendingPlan) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // sessionStorage unavailable (private mode etc.) — resume just won't
    // auto-fire, not fatal.
  }
}

export function loadPendingPlan(): PendingPlan | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingPlan) : null;
  } catch {
    return null;
  }
}

export function clearPendingPlan() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
