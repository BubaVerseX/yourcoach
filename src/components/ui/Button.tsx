import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "selected" | "ghost" | "accent";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** Sharp rectangle CTAs — no radius, no shadow, ≤150ms transitions.
 * "primary" / "accent" are the solid-red treatment; "ghost" is the
 * bordered secondary treatment; "selected" is an accent-outlined toggle
 * state (e.g. a chosen option that still reads as a button). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-none px-6 py-3.5 text-[15px] font-bold tracking-tight transition-[background-color,transform,color,border-color] duration-150 disabled:cursor-not-allowed",
        !disabled &&
          (variant === "primary" || variant === "accent") &&
          "bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)] active:translate-y-0.5",
        !disabled &&
          variant === "ghost" &&
          "border-[1.5px] border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:border-white active:translate-y-0.5",
        !disabled &&
          variant === "selected" &&
          "border-[1.5px] border-[var(--color-accent)] text-[var(--color-accent)] active:translate-y-0.5",
        disabled && "border border-[var(--color-border)] text-[var(--color-text-tertiary)]",
        className
      )}
      {...props}
    />
  );
});
