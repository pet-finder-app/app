import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { pressBrutal, shadowBrutal } from "./brutal";
import { cn } from "./cn";

/**
 * Botão do UI System. Use `variant` e `size`; não escreva classes de cor
 * fora daqui. `LinkButton` tem o mesmo visual para navegação.
 */

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "pill" | "danger" | "dark";

export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 font-bold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-line bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary",
  /** Amarelo vivo com texto preto, como o "Confirm" da referência. O hover
   *  escurece o próprio amarelo (nunca troca de matiz — consistência). */
  secondary:
    "border-line bg-accent-yellow text-black hover:brightness-95 active:brightness-90 focus-visible:ring-line",
  outline:
    "border-line bg-white text-neutral-900 hover:bg-neutral-50 focus-visible:ring-line",
  /** Pílula pequena, igual ao selo "ONG verificada": voltar, trocar etapa. */
  pill: "rounded-full border-line bg-primary-soft text-green-900 hover:bg-primary-faint focus-visible:ring-primary",
  danger:
    "border-line bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-700",
  /** Neutro escuro — usado hoje só no botão de entrar do login. */
  dark: "border-line bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900",
};

const sizes: Record<ButtonSize, string> = {
  sm: cn("min-h-7 px-3 py-1 text-xs", shadowBrutal.sm, pressBrutal.sm),
  md: cn("min-h-11 px-4 py-2.5 text-sm", shadowBrutal.md, pressBrutal.md),
  lg: cn(
    "min-h-12 w-full px-4 py-3.5 text-sm",
    shadowBrutal.lg,
    pressBrutal.lg,
  ),
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
  return cn(base, variants[variant], sizes[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Desabilita, marca aria-busy e troca o texto por `loadingLabel`. */
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
