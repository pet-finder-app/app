import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-neutral-100 text-neutral-800",
  info: "bg-primary-faint text-green-900",
  success: "bg-primary-soft text-green-900",
  warning: "bg-accent-yellow text-neutral-900",
  danger: "bg-accent-peach text-neutral-900",
};

const sizes: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: BadgeSize;
};

/** Selo pequeno de status — só a cor pastel do fundo, sem borda nem sombra. */
export function Badge({
  tone = "neutral",
  size = "md",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold",
        tones[tone],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
