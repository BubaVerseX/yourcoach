"use client";

import { useState, useTransition } from "react";
import { Play, Columns2 } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { AvatarViewer } from "@/components/avatar/AvatarViewer";
import { saveAvatarParams, type AvatarSlot } from "@/lib/actions/avatar";
import {
  AVATAR_HEIGHT_RANGE,
  DEFAULT_AVATAR_PARAMS,
  clampAvatarParams,
  type AvatarParams,
} from "@/lib/avatar/types";
import { cn } from "@/lib/utils";

function Slider({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]">
        <span>{label}</span>
        <span className="text-[var(--color-text-primary)]">
          {Math.round(value)}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-border)] accent-[var(--color-accent)]"
      />
    </label>
  );
}

function SexToggle({
  value,
  onChange,
  maleLabel,
  femaleLabel,
}: {
  value: AvatarParams["sex"];
  onChange: (sex: AvatarParams["sex"]) => void;
  maleLabel: string;
  femaleLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["male", "female"] as const).map((sex) => (
        <button
          key={sex}
          type="button"
          onClick={() => onChange(sex)}
          className={cn(
            "border px-3 py-2 text-sm font-bold transition-colors",
            value === sex
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-text-tertiary)]"
          )}
        >
          {sex === "male" ? maleLabel : femaleLabel}
        </button>
      ))}
    </div>
  );
}

export function GoalAvatarPanel({
  initialCurrent,
  initialGoal,
}: {
  initialCurrent: AvatarParams | null;
  initialGoal: AvatarParams | null;
}) {
  const { t } = useLocale();
  const tt = t.avatar;

  const [slot, setSlot] = useState<AvatarSlot>("current");
  const [draft, setDraft] = useState<AvatarParams>(initialCurrent ?? DEFAULT_AVATAR_PARAMS);
  const [saved, setSaved] = useState<{ current: AvatarParams | null; goal: AvatarParams | null }>({
    current: initialCurrent,
    goal: initialGoal,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function switchSlot(next: AvatarSlot) {
    setSlot(next);
    setCompareMode(false);
    setJustSaved(false);
    const existing = next === "current" ? saved.current : saved.goal;
    setDraft(existing ?? draft);
  }

  function update(patch: Partial<AvatarParams>) {
    setDraft((prev) => clampAvatarParams({ ...prev, ...patch }));
    setJustSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveAvatarParams(slot, draft);
      if (result.success) {
        setSaved((prev) => ({ ...prev, [slot]: result.params }));
        setJustSaved(true);
      }
    });
  }

  const canCompare = !!saved.current && !!saved.goal;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
          {tt.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{tt.subtitle}</p>
      </div>

      <Card className="text-xs text-[var(--color-text-tertiary)]">{tt.disclaimer}</Card>

      {compareMode && canCompare ? (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">{tt.compareTitle}</h2>
            <button
              type="button"
              onClick={() => setCompareMode(false)}
              className="text-xs font-bold text-[var(--color-accent)]"
            >
              {t.common.back}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-center text-xs font-bold text-[var(--color-text-secondary)]">
                {tt.editingCurrent}
              </span>
              <AvatarViewer
                params={saved.current!}
                className="h-[360px] w-full bg-[var(--color-bg)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-center text-xs font-bold text-[var(--color-accent)]">
                {tt.editingGoal}
              </span>
              <AvatarViewer
                params={saved.goal!}
                className="h-[360px] w-full bg-[var(--color-bg)]"
                accentHex="#0d6efd"
              />
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(["current", "goal"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => switchSlot(s)}
                className={cn(
                  "border px-3 py-2 text-sm font-bold transition-colors",
                  slot === s
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "border-[var(--color-border)] text-[var(--color-text-tertiary)]"
                )}
              >
                {s === "current" ? tt.editingCurrent : tt.editingGoal}
              </button>
            ))}
          </div>

          <Card className="flex flex-col gap-4">
            <SexToggle
              value={draft.sex}
              onChange={(sex) => update({ sex })}
              maleLabel={tt.male}
              femaleLabel={tt.female}
            />
            <Slider
              label={tt.height}
              value={draft.heightCm}
              min={AVATAR_HEIGHT_RANGE.min}
              max={AVATAR_HEIGHT_RANGE.max}
              suffix=" cm"
              onChange={(heightCm) => update({ heightCm })}
            />
            <Slider
              label={tt.muscle}
              value={draft.muscle}
              min={0}
              max={100}
              suffix="%"
              onChange={(muscle) => update({ muscle })}
            />
            <Slider
              label={tt.fat}
              value={draft.fat}
              min={0}
              max={100}
              suffix="%"
              onChange={(fat) => update({ fat })}
            />

            {!showPreview ? (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex items-center justify-center gap-2 border border-[var(--color-border)] py-3 text-sm font-bold text-[var(--color-text-secondary)]"
              >
                <Play strokeWidth={2} className="h-4 w-4" />
                {tt.showPreview}
              </button>
            ) : (
              <AvatarViewer
                params={draft}
                className="h-[360px] w-full bg-[var(--color-bg)]"
                accentHex={slot === "goal" ? "#0d6efd" : "#ff5722"}
              />
            )}

            <button
              type="button"
              disabled={pending}
              onClick={handleSave}
              className="border border-[var(--color-accent)] bg-[var(--color-accent)] py-3 text-sm font-bold text-black disabled:opacity-60"
            >
              {justSaved ? tt.saved : slot === "current" ? tt.saveCurrent : tt.saveGoal}
            </button>
          </Card>

          <button
            type="button"
            disabled={!canCompare}
            onClick={() => setCompareMode(true)}
            className="flex items-center justify-center gap-2 border border-[var(--color-border)] py-3 text-sm font-bold text-[var(--color-text-secondary)] disabled:opacity-40"
          >
            <Columns2 strokeWidth={2} className="h-4 w-4" />
            {tt.compare}
          </button>
          {!canCompare && (
            <p className="text-center text-xs text-[var(--color-text-tertiary)]">
              {!saved.current ? tt.noCurrentYet : tt.noGoalYet}
            </p>
          )}
        </>
      )}
    </div>
  );
}
