import type { HTMLAttributes } from "react";
import { shadowBrutal } from "./brutal";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-white text-neutral-800",
  info: "bg-primary-faint text-green-900",
  success: "bg-primary-soft text-green-900",
  warning: "bg-accent-yellow text-neutral-900",
  danger: "bg-accent-peach text-neutral-900",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

/** Selo pequeno de status. */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-line px-3 py-1 text-xs font-bold",
        shadowBrutal.sm,
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
