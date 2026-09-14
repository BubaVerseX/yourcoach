"use client";

import { Download, Share2 } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { Button } from "@/components/ui/Button";
import { DuotonePhoto } from "@/components/ui/DuotonePhoto";
import { caloriesToKhinkali, estimateWorkoutCalories } from "@/lib/plan/culturalUnits";

const ESTIMATED_CALORIES_PER_WORKOUT = estimateWorkoutCalories(45);

function drawWrappedCard(
  canvas: HTMLCanvasElement,
  data: {
    appName: string;
    dateRangeLabel: string;
    workoutsThisWeek: number;
    mealsOnTargetPercent: number | null;
    streak: number;
    workoutsLabel: string;
    mealsLabel: string;
    streakLabel: string;
    khinkaliLabel: string;
  }
) {
  const width = 800;
  const height = 1000;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#06080a";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(90, 90);
  ctx.rotate(-0.35);
  ctx.fillStyle = "rgba(255,87,34,0.1)";
  ctx.fillRect(-140, -140, 280, 280);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let x = -height; x < width + height; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 30px -apple-system, sans-serif";
  ctx.fillText(data.appName, 64, 90);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "700 16px ui-monospace, monospace";
  ctx.fillText(data.dateRangeLabel, 64, 118);

  ctx.fillStyle = "#ff5722";
  ctx.font = "800 170px -apple-system, sans-serif";
  ctx.fillText(`${data.workoutsThisWeek}/7`, 60, 400);
  ctx.fillRect(64, 424, 78, 3);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "700 26px -apple-system, sans-serif";
  ctx.fillText(data.workoutsLabel, 64, 466);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 18px -apple-system, sans-serif";
  ctx.fillText(data.khinkaliLabel, 64, 496);

  const statY = 660;
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 56px -apple-system, sans-serif";
  ctx.fillText(data.mealsOnTargetPercent != null ? `${data.mealsOnTargetPercent}%` : "—", 64, statY);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 20px -apple-system, sans-serif";
  ctx.fillText(data.mealsLabel, 64, statY + 34);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 56px -apple-system, sans-serif";
  ctx.fillText(`${data.streak}`, 420, statY);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 20px -apple-system, sans-serif";
  ctx.fillText(data.streakLabel, 420, statY + 34);
}

export function WeeklyWrappedCard({
  workoutsThisWeek,
  mealsOnTargetPercent,
  streak,
  calorieTarget,
  dateRangeLabel,
}: {
  workoutsThisWeek: number;
  mealsOnTargetPercent: number | null;
  streak: number;
  calorieTarget: number | null;
  dateRangeLabel: string;
}) {
  const { t } = useLocale();
  const khinkaliCount = caloriesToKhinkali(workoutsThisWeek * ESTIMATED_CALORIES_PER_WORKOUT);
  const khinkaliLabel = format(t.common.khinkaliBurned, { count: khinkaliCount });

  function renderToBlob(cb: (blob: Blob) => void) {
    const canvas = document.createElement("canvas");
    drawWrappedCard(canvas, {
      appName: t.common.appName,
      dateRangeLabel,
      workoutsThisWeek,
      mealsOnTargetPercent,
      streak,
      workoutsLabel: t.progress.wrappedWorkouts,
      mealsLabel: t.progress.wrappedMealsOnTarget,
      streakLabel: format(t.home.streakDays, { count: streak }),
      khinkaliLabel,
    });
    canvas.toBlob((blob) => {
      if (blob) cb(blob);
    }, "image/png");
  }

  function handleSave() {
    renderToBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shadowcoach-weekly-wrapped.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleShare() {
    renderToBlob(async (blob) => {
      const file = new File([blob], "shadowcoach-weekly-wrapped.png", { type: "image/png" });
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: t.common.appName });
          return;
        } catch {
          // user cancelled or share failed — fall through to a direct download
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shadowcoach-weekly-wrapped.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="relative overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-deep)] p-6 text-white">
      <div
        className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rotate-[24deg] bg-[var(--color-accent)] opacity-10"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-display block text-lg tracking-[0.04em]">{t.common.appName.toUpperCase()}</span>
            <span className="text-mono-label block text-[10px] text-white/45">{dateRangeLabel}</span>
          </div>
          <span className="text-mono-label bg-[var(--color-accent)] px-2.5 py-1 text-[9px] text-[var(--color-bg)]">
            WRAPPED
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-display text-[96px] text-[var(--color-accent)] sm:text-[132px]">
              {workoutsThisWeek}/7
            </span>
            <span className="flex flex-col gap-0.5 pb-2">
              <span className="text-lg font-black text-[var(--color-accent)]">{t.nav.workouts}</span>
              <span className="text-mono-label text-[9px] text-white/45">SESSIONS LOGGED</span>
            </span>
          </div>
          <span className="mt-3 block h-[3px] w-[78px] bg-[var(--color-accent)]" />
          <div className="mt-2 text-xs text-white/45">{khinkaliLabel}</div>
        </div>

        <div className="relative h-[118px] w-full overflow-hidden">
          <DuotonePhoto src={null} alt="" className="h-full w-full" />
          <div
            className="absolute right-0 bottom-0 left-0 h-6 bg-[var(--color-bg-deep)]"
            style={{ clipPath: "polygon(0 100%, 100% 30%, 100% 100%)" }}
          />
        </div>

        <div className="flex flex-col divide-y divide-white/10 border-y border-white/10">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-white/60">{t.progress.wrappedStreak}</span>
            <span className="text-mono-label text-sm text-white">{streak}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-white/60">{t.progress.wrappedMealsOnTarget}</span>
            <span className="text-mono-label text-sm text-white">
              {mealsOnTargetPercent != null ? `${mealsOnTargetPercent}%` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-white/60">{t.home.calorieTarget}</span>
            <span className="text-mono-label text-sm text-white">
              {calorieTarget != null ? `${calorieTarget} KCAL` : "—"}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="primary" className="flex-1" onClick={handleShare}>
            <Share2 strokeWidth={1.8} className="h-4 w-4" />
            {t.progress.wrappedShare}
          </Button>
          <Button variant="ghost" className="flex-1 !text-white" onClick={handleSave}>
            <Download strokeWidth={1.8} className="h-4 w-4" />
            {t.progress.wrappedSave}
          </Button>
        </div>
      </div>
    </div>
  );
}
