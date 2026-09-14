import Link from "next/link";
import { Lock } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { format } from "@/lib/i18n/format";
import { PREMIUM_ANNUAL_PRICE } from "@/lib/payments/ipay";
import { cn } from "@/lib/utils";

/** Server-page entry point — re-exports the client PaywallLock (see
 * PaywallLockClient.tsx) since the blurred content it wraps needs a
 * clickable <div>, not a <Link>, to safely nest the real content's own
 * links/buttons (image attribution, swap/log toggles) without invalid HTML. */
export { PaywallLockClient as PaywallLock } from "@/components/PaywallLockClient";

/** Simpler variant for a section that has no real content to blur (e.g. the
 * entire workout plan, which isn't teased at all) — a flat locked card with
 * no nested interactive children, so a plain Link is safe here. */
export async function PaywallLockCard({
  title,
  body,
  className,
}: {
  title: string;
  body: string;
  className?: string;
}) {
  const { t } = await getServerDictionary();
  const cta = format(t.premium.unlockCta, PREMIUM_ANNUAL_PRICE);

  return (
    <Link
      href="/upgrade"
      className={cn(
        "flex flex-col items-center gap-3 border border-dashed border-[var(--color-border-strong)] p-6 text-center transition-colors hover:border-[var(--color-accent)]",
        className
      )}
    >
      <Lock strokeWidth={1.8} className="h-6 w-6 text-[var(--color-accent)]" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{body}</p>
      </div>
      <span className="mt-1 border border-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-[var(--color-accent)]">
        {cta}
      </span>
    </Link>
  );
}
