import { PetfinderMark } from "@/components/brand/petfinder-mark";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, Ref } from "react";
import { cn } from "./cn";
import { pressSoft, shadowSoft } from "./elevation";

/** Shared UI button. Choose variant and size rather than adding external color classes. LinkButton uses the same styles for navigation. */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "pill"
  | "danger"
  | "danger-ghost"
  | "dark"
  | "photo"
  | "photo-back"
  | "filter";

export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-bold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none";

const variants: Record<ButtonVariant, string> = {
  filter:
    "rounded-full border border-border-light bg-white text-text shadow-none! tracking-normal font-medium aria-checked:border-primary aria-checked:bg-primary data-[selected=true]:border-primary data-[selected=true]:bg-primary hover:bg-secondary focus-visible:ring-text",
  photo:
    "min-h-13 rounded-[0.625rem] bg-primary text-base text-text shadow-none hover:bg-primary-hover focus-visible:ring-primary focus-visible:ring-offset-bg-black",
  "photo-back":
    "bg-transparent text-black shadow-none hover:underline focus-visible:ring-black focus-visible:ring-offset-primary",
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary",
  /** Pastel yellow with dark text; hover darkens the same hue. */
  secondary:
    "bg-accent-yellow text-neutral-900 hover:brightness-95 active:brightness-90 focus-visible:ring-amber-200",
  outline:
    "border border-stone-300 bg-white text-neutral-900 hover:bg-neutral-50 focus-visible:ring-stone-300",
  /** Small pill button for returning or changing steps. */
  pill: "rounded-full bg-primary-soft text-lime-800 hover:bg-primary-faint focus-visible:ring-primary",
  danger: "bg-red-700 text-white hover:bg-red-600 focus-visible:ring-red-400",
  "danger-ghost":
    "bg-transparent text-red-700 shadow-none! hover:bg-red-50 focus-visible:ring-red-700",
  /** Dark neutral button variant. */
  dark: "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-gray-400",
};

const sizes: Record<ButtonSize, string> = {
  sm: cn("min-h-7 px-3 py-1 text-xs", shadowSoft.sm, pressSoft.sm),
  md: cn("min-h-11 px-4 py-2.5 text-sm", shadowSoft.md, pressSoft.md),
  lg: cn("min-h-12 w-full px-4 py-3.5 text-sm", shadowSoft.lg, pressSoft.lg),
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const photoSize =
    variant === "photo"
      ? "min-h-13 w-full px-4 py-3.5 text-base"
      : variant === "photo-back"
        ? "min-h-9 px-0 py-2 text-sm"
        : undefined;
  return cn(base, variants[variant], photoSize ?? sizes[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Disable the control, set aria-busy, and replace its text with loadingLabel. */
  loading?: boolean;
  loadingLabel?: string;
};

export function Button({
  variant,
  size,
  loading = false,
  loadingLabel,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading ? (
        <PetfinderMark className="magnifier-loading size-5 shrink-0" />
      ) : null}
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export type LinkButtonProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function LinkButton({
  href,
  variant,
  size,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
