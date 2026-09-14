"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Chip, ChipGroup } from "@/components/ui/Chip";
import { submitOnboarding, type OnboardingInput } from "./actions";
import { loadPendingPlan, clearPendingPlan } from "@/lib/plan/pendingPlan";

const ALLERGY_OPTIONS = ["nuts", "peanuts", "dairy", "egg", "gluten", "soy", "fish", "shellfish"] as const;
const RESTRICTION_OPTIONS = ["vegetarian", "vegan", "gluten_free", "dairy_free", "pescatarian"] as const;
const TOTAL_STEPS = 4;

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

export default function OnboardingPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // If the user completed the intake quiz anonymously via /get-started and
  // had to confirm their email before a session existed, their answers are
  // waiting in sessionStorage — submit them now instead of making them redo
  // the form. Read synchronously on first render so there's no flash of the
  // manual form.
  const [pendingPlan] = useState(() => loadPendingPlan());
  const [resuming, setResuming] = useState(!!pendingPlan);

  useEffect(() => {
    if (!pendingPlan) return;

    submitOnboarding(pendingPlan.input).then((result) => {
      clearPendingPlan();
      if (result.error) {
        setResuming(false);
        return;
      }
      router.push("/home");
      router.refresh();
    });
  }, [pendingPlan, router]);

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

  function canProceed() {
    if (step === 1) return form.fullName && form.age && form.sex && form.weightKg && form.heightCm;
    if (step === 2) return form.activityLevel && form.goal;
    if (step === 3) return true;
    if (step === 4) return form.timeAvailableMinutes && form.equipmentSetting;
    return false;
  }

  async function handleFinish() {
    setError(null);
    setSubmitting(true);

    const result = await submitOnboarding({
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
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  if (resuming || submitting) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Card className="flex flex-col items-center gap-4 text-center">
          <div className="soft-pressed h-14 w-14 animate-pulse rounded-2xl" />
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
            {t.onboarding.generating}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-10">
      <div className="mb-6 flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {format(t.onboarding.stepOf, { current: step, total: TOTAL_STEPS })}
        </span>
        <div className="soft-pressed flex h-2 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <Card className="flex flex-col gap-5">
        {step === 1 && (
          <>
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
          </>
        )}

        {step === 2 && (
          <>
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
          </>
        )}

        {step === 3 && (
          <>
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
              <p className="mb-2 text-xs text-[var(--color-text-tertiary)]">
                {t.onboarding.medicalConditionsHint}
              </p>
              <Textarea
                id="medicalConditions"
                rows={2}
                value={form.medicalConditions}
                onChange={(e) => update("medicalConditions", e.target.value)}
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
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
                      form.equipmentSetting === value
                        ? "soft-pressed text-[var(--color-accent)]"
                        : "soft-raised"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm font-medium text-[var(--color-accent)]">{error}</p>}

        <div className="mt-2 flex gap-3">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              {t.common.back}
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button disabled={!canProceed()} onClick={() => setStep((s) => s + 1)} className="flex-1">
              {t.common.next}
            </Button>
          ) : (
            <Button disabled={!canProceed()} onClick={handleFinish} className="flex-1">
              {t.onboarding.finish}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
