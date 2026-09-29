import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeTone =
  "neutral" | "info" | "success" | "warning" | "danger" | "outline";
export type BadgeSize = "sm" | "md";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-blue-400 text-neutral-900",
  info: "bg-primary-faint text-lime-800",
  success: "bg-primary-soft text-lime-800",
  warning: "bg-orange-300 text-neutral-900",
  danger: "bg-accent-peach text-neutral-900",
  /** Tag neutra de metadado (espécie, raça, idade...) — não é status. */
  outline: "border border-neutral-900 bg-white text-neutral-900",
};

const sizes: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: BadgeSize;
};

/** Selo pequeno de status — sem borda nem sombra por padrão. */
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
