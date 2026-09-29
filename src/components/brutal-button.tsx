import { cn } from "@/components/ui";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

/**
 * Botão neo-brutalista das telas de perfil/dashboard: borda fina
 * neutral-900, sem sombra — a versão de `Button`/`LinkButton` (soft UI)
 * para essas telas.
 */

export type BrutalButtonVariant =
  "primary" | "secondary" | "outline" | "pill" | "danger" | "dark";

export type BrutalButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-900 font-bold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

const variants: Record<BrutalButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary",
  secondary:
    "bg-accent-yellow text-neutral-900 hover:brightness-95 active:brightness-90 focus-visible:ring-amber-200",
  outline:
    "bg-white text-neutral-900 hover:bg-neutral-50 focus-visible:ring-stone-300",
  pill: "rounded-full bg-primary-soft text-neutral-900 hover:bg-primary-faint focus-visible:ring-primary",
  danger: "bg-red-500 text-white hover:bg-red-400 focus-visible:ring-red-400",
  dark: "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-gray-400",
};

const sizes: Record<BrutalButtonSize, string> = {
  sm: "min-h-7 px-3 py-1 text-xs",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 w-full px-4 py-3.5 text-sm",
};

function brutalButtonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: BrutalButtonVariant;
  size?: BrutalButtonSize;
  className?: string;
}): string {
  return cn(base, variants[variant], sizes[size], className);
}

export type BrutalButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BrutalButtonVariant;
  size?: BrutalButtonSize;
  loading?: boolean;
  loadingLabel?: string;
};

export function BrutalButton({
  variant,
  size,
  loading = false,
  loadingLabel,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: BrutalButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={brutalButtonClasses({ variant, size, className })}
      {...props}
    >
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export type BrutalLinkButtonProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  href: string;
  variant?: BrutalButtonVariant;
  size?: BrutalButtonSize;
};

export function BrutalLinkButton({
  href,
  variant,
  size,
  className,
  ...props
}: BrutalLinkButtonProps) {
  return (
    <Link
      href={href}
      className={brutalButtonClasses({ variant, size, className })}
      {...props}
    />
  );
}
