"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Lock } from "lucide-react";
import { useLocale, format } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Chip, ChipGroup } from "@/components/ui/Chip";
import { PaywallLockClient } from "@/components/PaywallLockClient";
import type { OnboardingInput } from "@/app/onboarding/actions";
import { submitOnboarding } from "@/app/onboarding/actions";
import {
  generateMealPlanData,
  DAYS_OF_WEEK,
  type MealPlanProfileInput,
} from "@/lib/plan/mealPlan";
import { generateWorkoutPlanData, type WorkoutPlanProfileInput } from "@/lib/plan/workoutPlan";
import { fetchAllRecipes, fetchAllExercises, createPreviewId } from "@/lib/plan/previewPlan";
import { currentWeekStart, dayKeyForDate } from "@/lib/plan/weekDate";
import { dayLabel } from "@/lib/plan/dayLabel";
import type { GeneratedMealPlan, GeneratedWorkoutPlan } from "@/lib/actions/preview";
import { savePendingPlan } from "@/lib/plan/pendingPlan";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { MealPreview } from "./MealPreview";

const ALLERGY_OPTIONS = ["nuts", "peanuts", "dairy", "egg", "gluten", "soy", "fish", "shellfish"] as const;
const RESTRICTION_OPTIONS = ["vegetarian", "vegan", "gluten_free", "dairy_free", "pescatarian"] as const;

type Step = "basics" | "activity" | "diet" | "meal_preview" | "workout_setup" | "full_preview" | "signup";

type FormState = {
  fullName: string;
  age: string;
  sex: OnboardingInput["sex"] | "";
  weightKg: string;
  heightCm: string;
  activityLevel: OnboardingInput["activityLevel"] | "";
  goal: OnboardingInput["goal"] | "";
  allergies: string[];
  dietaryRestrictions: string[];
  restrictionsNotes: string;
  medicalConditions: string;
  timeAvailableMinutes: string;
  equipmentSetting: OnboardingInput["equipmentSetting"] | "";
};

const initialState: FormState = {
  fullName: "",
  age: "",
  sex: "",
  weightKg: "",
  heightCm: "",
  activityLevel: "",
  goal: "",
  allergies: [],
  dietaryRestrictions: [],
  restrictionsNotes: "",
  medicalConditions: "",
  timeAvailableMinutes: "",
  equipmentSetting: "",
};

const STEP_ORDER: Step[] = ["basics", "activity", "diet", "meal_preview", "workout_setup", "full_preview", "signup"];

export function GetStartedFlow() {
  const { t } = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>("basics");
  const [form, setForm] = useState<FormState>(initialState);
  const [previewId] = useState(() => createPreviewId());
  const [recipes, setRecipes] = useState<Tables<"recipes">[]>([]);
  const [exercises, setExercises] = useState<Tables<"exercises">[]>([]);
  const [mealPlan, setMealPlan] = useState<GeneratedMealPlan | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<GeneratedWorkoutPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleInList(key: "allergies" | "dietaryRestrictions", value: string) {
    setForm((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  function goBack() {
    const prev = STEP_ORDER[Math.max(0, stepIndex - 1)];
    setStep(prev);
  }

  const mealProfileInput: MealPlanProfileInput = {
    id: previewId,
    weight_kg: Number(form.weightKg) || null,
    height_cm: Number(form.heightCm) || null,
    age: Number(form.age) || null,
    sex: form.sex || null,
    activity_level: form.activityLevel || null,
    goal: form.goal || null,
    allergies: form.allergies,
    dietary_restrictions: form.dietaryRestrictions,
  };

  async function handleGenerateMealPlan() {
    setGenerating(true);
    setGenError(null);
    const fetchedRecipes = recipes.length ? recipes : await fetchAllRecipes();
    setRecipes(fetchedRecipes);

    const result = generateMealPlanData(mealProfileInput, fetchedRecipes, currentWeekStart());
    setGenerating(false);
    if (!result) {
      setGenError(t.common.error);
      return;
    }
    setMealPlan({ planData: result.planData, calorieTarget: result.calorieTarget, macros: result.macros });
    setStep("meal_preview");
  }

  async function handleGenerateWorkoutPlan() {
    setGenerating(true);
    setGenError(null);
    const fetchedExercises = exercises.length ? exercises : await fetchAllExercises();
    setExercises(fetchedExercises);

    const workoutProfileInput: WorkoutPlanProfileInput = {
      id: previewId,
      goal: form.goal || null,
      time_available_minutes: Number(form.timeAvailableMinutes) || null,
    };
    const setting = (form.equipmentSetting || "home") as "home" | "gym" | "both";
    const planData = generateWorkoutPlanData(workoutProfileInput, fetchedExercises, currentWeekStart(), setting);
    setGenerating(false);
    setWorkoutPlan({ planData, setting });
    setStep("full_preview");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError(null);

    if (!accepted) {
      setSignupError(t.disclaimer.mustAccept);
      return;
    }
    if (!mealPlan || !workoutPlan) return;

    const input: OnboardingInput = {
      fullName: form.fullName,
      age: Number(form.age),
      sex: form.sex as OnboardingInput["sex"],
      weightKg: Number(form.weightKg),
      heightCm: Number(form.heightCm),
      activityLevel: form.activityLevel as OnboardingInput["activityLevel"],
      goal: form.goal as OnboardingInput["goal"],
      allergies: form.allergies,
      dietaryRestrictions: form.dietaryRestrictions,
      restrictionsNotes: form.restrictionsNotes,
      medicalConditions: form.medicalConditions,
      timeAvailableMinutes: Number(form.timeAvailableMinutes),
      equipmentSetting: form.equipmentSetting as OnboardingInput["equipmentSetting"],
    };

    setSubmitting(true);
    savePendingPlan({ input });

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setSignupError(error.message);
      setSubmitting(false);
      return;
    }

    if (data.session) {
      // Only the intake answers are saved — no free persistent plan. /home
      // will compute a fresh (unsaved) teaser plan from this profile via the
      // ephemeral path (see getOrCreateWeekPlans) until they subscribe.
      const result = await submitOnboarding(input);
      setSubmitting(false);
      if (result.error) {
        setSignupError(result.error);
        return;
      }
      router.push("/home");
      router.refresh();
      return;
    }

    setSubmitting(false);
    setCheckEmail(true);
  }

  function canProceedBasics() {
    return !!(form.fullName && form.age && form.sex && form.weightKg && form.heightCm);
  }
  function canProceedActivity() {
    return !!(form.activityLevel && form.goal);
  }
  function canProceedWorkoutSetup() {
    return !!(form.timeAvailableMinutes && form.equipmentSetting);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-5 py-10">
      {(step === "basics" || step === "activity" || step === "diet" || step === "workout_setup") && (
        <div className="mb-6 flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            {step === "workout_setup"
              ? t.templates.title
              : `${stepIndex + 1} / 3`}
          </span>
          <div className="soft-pressed flex h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all"
              style={{ width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {generating && (
        <Card className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="soft-pressed h-14 w-14 animate-pulse rounded-2xl" />
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
            {t.onboarding.generating}
          </p>
        </Card>
      )}

      {!generating && step === "basics" && (
        <Card className="flex flex-col gap-5">
          <h1 className="text-2xl font-extrabold tracking-tight">{t.onboarding.stepBasics}</h1>
          <div>
            <Label htmlFor="fullName">{t.profile.title}</Label>
            <Input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">{t.onboarding.age}</Label>
              <Input id="age" type="number" min={13} max={100} value={form.age} onChange={(e) => update("age", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sex">{t.onboarding.sex}</Label>
              <Select id="sex" value={form.sex} onChange={(e) => update("sex", e.target.value as FormState["sex"])}>
                <option value="" disabled>
                  —
                </option>
                <option value="male">{t.onboarding.sexMale}</option>
                <option value="female">{t.onboarding.sexFemale}</option>
                <option value="other">{t.onboarding.sexOther}</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">{t.onboarding.weight}</Label>
              <Input id="weight" type="number" min={1} value={form.weightKg} onChange={(e) => update("weightKg", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="height">{t.onboarding.height}</Label>
              <Input id="height" type="number" min={1} value={form.heightCm} onChange={(e) => update("heightCm", e.target.value)} />
            </div>
          </div>
          <Button disabled={!canProceedBasics()} onClick={() => setStep("activity")}>
            {t.common.next}
          </Button>
        </Card>
      )}

      {!generating && step === "activity" && (
        <Card className="flex flex-col gap-5">
          <h1 className="text-2xl font-extrabold tracking-tight">{t.onboarding.stepActivity}</h1>
          <div>
            <Label htmlFor="activityLevel">{t.onboarding.activityLevel}</Label>
            <Select
              id="activityLevel"
              value={form.activityLevel}
              onChange={(e) => update("activityLevel", e.target.value as FormState["activityLevel"])}
            >
              <option value="" disabled>
                —
              </option>
              <option value="sedentary">{t.onboarding.activitySedentary}</option>
              <option value="light">{t.onboarding.activityLight}</option>
              <option value="moderate">{t.onboarding.activityModerate}</option>
              <option value="active">{t.onboarding.activityActive}</option>
              <option value="very_active">{t.onboarding.activityVeryActive}</option>
            </Select>
          </div>
          <div>
            <Label>{t.onboarding.goal}</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["lose_weight", t.onboarding.goalLose],
                  ["gain_weight", t.onboarding.goalGain],
                  ["maintain", t.onboarding.goalMaintain],
                  ["build_muscle", t.onboarding.goalMuscle],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("goal", value)}
                  className={`rounded-2xl p-3 text-left text-sm font-semibold transition-all ${
                    form.goal === value ? "soft-pressed text-[var(--color-accent)]" : "soft-raised"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack}>
              {t.common.back}
            </Button>
            <Button disabled={!canProceedActivity()} onClick={() => setStep("diet")} className="flex-1">
              {t.common.next}
            </Button>
          </div>
        </Card>
      )}

      {!generating && step === "diet" && (
        <Card className="flex flex-col gap-5">
          <h1 className="text-2xl font-extrabold tracking-tight">{t.onboarding.stepDiet}</h1>
          <div>
            <Label>{t.onboarding.allergies}</Label>
            <ChipGroup>
              {ALLERGY_OPTIONS.map((allergy) => (
                <Chip
                  key={allergy}
                  type="button"
                  selected={form.allergies.includes(allergy)}
                  onClick={() => toggleInList("allergies", allergy)}
                >
                  {t.allergens[allergy]}
                </Chip>
              ))}
            </ChipGroup>
          </div>
          <div>
            <Label>{t.onboarding.dietaryRestrictions}</Label>
            <ChipGroup>
              {RESTRICTION_OPTIONS.map((restriction) => (
                <Chip
                  key={restriction}
                  type="button"
                  selected={form.dietaryRestrictions.includes(restriction)}
                  onClick={() => toggleInList("dietaryRestrictions", restriction)}
                >
                  {t.dietaryTags[restriction]}
                </Chip>
              ))}
            </ChipGroup>
          </div>
          <div>
            <Label htmlFor="restrictionsNotes">
              {t.onboarding.restrictionsNotes} <span className="font-normal">({t.common.optional})</span>
            </Label>
            <Textarea
              id="restrictionsNotes"
              rows={2}
              value={form.restrictionsNotes}
              onChange={(e) => update("restrictionsNotes", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="medicalConditions">
              {t.onboarding.medicalConditions} <span className="font-normal">({t.common.optional})</span>
            </Label>
            <p className="mb-2 text-xs text-[var(--color-text-tertiary)]">{t.onboarding.medicalConditionsHint}</p>
            <Textarea
              id="medicalConditions"
              rows={2}
              value={form.medicalConditions}
              onChange={(e) => update("medicalConditions", e.target.value)}
            />
          </div>
          {genError && <p className="text-sm font-medium text-[var(--color-accent)]">{genError}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goBack}>
              {t.common.back}
            </Button>
            <Button onClick={handleGenerateMealPlan} className="flex-1">
              {t.onboarding.finish}
            </Button>
          </div>
        </Card>
      )}

      {!generating && step === "meal_preview" && mealPlan && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{t.meals.title}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{t.onboarding.mealPreviewSubtitle}</p>
          </div>
          <MealPreview
            profile={mealProfileInput}
            recipes={recipes}
            mealPlan={mealPlan}
            unlockedDay={dayKeyForDate()}
            onChange={setMealPlan}
          />
          <Card className="flex flex-col items-center gap-3 text-center">
            <Sparkles strokeWidth={1.8} className="h-6 w-6 text-[var(--color-accent)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">{t.onboarding.continueToWorkoutBody}</p>
            <Button onClick={() => setStep("workout_setup")} className="w-full">
              {t.onboarding.continueToWorkout}
            </Button>
          </Card>
        </div>
      )}

      {!generating && step === "workout_setup" && (
        <Card className="flex flex-col gap-5">
          <h1 className="text-2xl font-extrabold tracking-tight">{t.onboarding.stepExercise}</h1>
          <div>
            <Label htmlFor="timeAvailable">{t.onboarding.timeAvailable}</Label>
            <Input
              id="timeAvailable"
              type="number"
              min={0}
              value={form.timeAvailableMinutes}
              onChange={(e) => update("timeAvailableMinutes", e.target.value)}
            />
          </div>
          <div>
            <Label>{t.onboarding.equipmentSetting}</Label>
            <div className="flex flex-col gap-2">
              {(
                [
                  ["home", t.onboarding.equipmentHome],
                  ["gym", t.onboarding.equipmentGym],
                  ["both", t.onboarding.equipmentBoth],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("equipmentSetting", value)}
                  className={`rounded-2xl p-3.5 text-left text-sm font-semibold transition-all ${
                    form.equipmentSetting === value ? "soft-pressed text-[var(--color-accent)]" : "soft-raised"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep("meal_preview")}>
              {t.common.back}
            </Button>
            <Button disabled={!canProceedWorkoutSetup()} onClick={handleGenerateWorkoutPlan} className="flex-1">
              {t.onboarding.finish}
            </Button>
          </div>
        </Card>
      )}

      {!generating && step === "full_preview" && mealPlan && workoutPlan && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{t.onboarding.workoutPreviewTitle}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{t.onboarding.workoutLockedBody}</p>
          </div>
          <PaywallLockClient className="flex flex-col gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const dayPlan = workoutPlan.planData.days[day];
              return (
                <Card key={day} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    {dayLabel(day, t)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent-2)]">
                    <Lock strokeWidth={1.8} className="h-3.5 w-3.5" />
                    {dayPlan.type === "workout"
                      ? format(t.onboarding.workoutExerciseCount, { count: dayPlan.exercises.length })
                      : t.workouts.restDay}
                  </span>
                </Card>
              );
            })}
          </PaywallLockClient>
          <Card className="flex flex-col items-center gap-3 text-center">
            <Sparkles strokeWidth={1.8} className="h-7 w-7 text-[var(--color-accent)]" />
            <h2 className="text-lg font-extrabold tracking-tight">{t.onboarding.saveCta}</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">{t.onboarding.saveCtaBody}</p>
            <Button onClick={() => setStep("signup")} className="w-full">
              {t.auth.signupButton}
            </Button>
          </Card>
        </div>
      )}

      {step === "signup" && mealPlan && workoutPlan && (
        <Card className="flex flex-col gap-6">
          {checkEmail ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <h1 className="text-xl font-extrabold tracking-tight">{t.auth.signupTitle}</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">{t.auth.checkEmail}</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">{t.auth.signupTitle}</h1>
              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">{t.auth.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">{t.auth.passwordHint}</p>
                </div>
                <div className="soft-pressed flex gap-3 rounded-2xl p-4">
                  <input
                    id="disclaimer"
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                  />
                  <label htmlFor="disclaimer" className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    <span className="mb-1 block font-bold text-[var(--color-text-primary)]">
                      {t.disclaimer.title}
                    </span>
                    {t.disclaimer.body}
                    <br />
                    <Link href="/legal/disclaimer" className="font-semibold text-[var(--color-accent)]">
                      {t.nav.disclaimer}
                    </Link>
                  </label>
                </div>
                {signupError && <p className="text-sm font-medium text-[var(--color-accent)]">{signupError}</p>}
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setStep("full_preview")}>
                    {t.common.back}
                  </Button>
                  <Button type="submit" disabled={submitting || !accepted} className="flex-1">
                    {submitting ? t.common.loading : t.auth.signupButton}
                  </Button>
                </div>
              </form>
              <p className="text-center text-sm text-[var(--color-text-secondary)]">
                {t.auth.haveAccount}{" "}
                <Link href="/login" className="font-semibold text-[var(--color-accent)]">
                  {t.auth.loginLink}
                </Link>
              </p>
            </>
          )}
        </Card>
      )}

      {step !== "basics" && !generating && (
        <Link
          href="/"
          className="mt-6 flex w-fit items-center gap-2 self-center text-xs font-semibold text-[var(--color-text-tertiary)]"
        >
          <ArrowLeft strokeWidth={1.8} className="h-3.5 w-3.5" />
          {t.common.cancel}
        </Link>
      )}
    </div>
  );
}
