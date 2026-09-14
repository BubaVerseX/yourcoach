"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useLocale, format } from "@/lib/i18n";
import { PREMIUM_ANNUAL_PRICE } from "@/lib/payments/ipay";
import { cn } from "@/lib/utils";

/**
 * Wraps real (already-computed) content, blurs it, and overlays a single
 * "Unlock" CTA that navigates to /upgrade — used everywhere the app shows a
 * non-subscriber what's *there* (their actual plan) without letting them use
 * it. Deliberately shows the real content blurred rather than a fake
 * placeholder: it's honest about what unlocking gets them.
 *
 * Uses a clickable <div> (not <Link>/<a>) on purpose: the wrapped content is
 * real plan data and often contains its own links/buttons (image
 * attribution, swap toggles, log buttons) — nesting those inside an <a>
 * wrapper is invalid HTML and breaks React hydration. A div has no such
 * restriction.
 */
export function PaywallLockClient({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const cta = format(t.premium.unlockCta, PREMIUM_ANNUAL_PRICE);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push("/upgrade")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.push("/upgrade");
      }}
      className={cn("group relative block cursor-pointer", className)}
    >
      <div aria-hidden className="pointer-events-none blur-[6px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/35">
        <span className="flex items-center gap-1.5 border border-[var(--color-accent)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-bold text-[var(--color-accent)] shadow-lg transition-transform group-hover:scale-[1.03]">
          <Lock strokeWidth={2} className="h-3.5 w-3.5" />
          {cta}
        </span>
      </div>
    </div>
  );
}
