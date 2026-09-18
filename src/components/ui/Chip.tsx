import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Sharp rectangle chip — no radius. Selected state is a red-filled
 * segment (language switch, filter tabs); unselected is bordered. */
export function Chip({ selected, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-none px-4 py-2 text-[13px] font-bold tracking-tight transition-colors duration-150",
        selected
          ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
          : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ChipGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap gap-2 rounded-none", className)}
      {...props}
    />
  );
}
