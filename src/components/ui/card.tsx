import type { HTMLAttributes } from "react";
import { cn } from "./cn";
import { shadowSoft } from "./elevation";

type CardProps = HTMLAttributes<HTMLElement> & {
  /** Elemento semântico do cartão: section (padrão), header, article... */
  as?: "section" | "header" | "article" | "div";
  /** Cor de fundo: branco (padrão), amarelo de destaque ou verde de sucesso. */
  tone?: "default" | "highlight" | "success";
};

const CARD_TONE = {
  default: "bg-white",
  highlight: "bg-accent-yellow",
  success: "bg-primary-faint",
} as const;

/** Cartão branco padrão para conteúdo em fundo neutro. */
export function Card({
  as: Tag = "section",
  tone = "default",
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        cn(
          "flex flex-col gap-4 rounded-3xl p-5",
          CARD_TONE[tone],
          shadowSoft.lg,
        ),
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base font-bold text-neutral-900", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-neutral-600", className)} {...props} />;
}
