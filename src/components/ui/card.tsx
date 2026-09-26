import type { HTMLAttributes } from "react";
import { shadowBrutal } from "./brutal";
import { cn } from "./cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  /** Elemento semântico do cartão: section (padrão), header, article... */
  as?: "section" | "header" | "article" | "div";
};

/** Cartão branco padrão para conteúdo em fundo neutro. */
export function Card({ as: Tag = "section", className, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        cn(
          "flex flex-col gap-4 rounded-xl border-2 border-line bg-white p-5",
          shadowBrutal.lg,
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
  return <p className={cn("text-xs text-neutral-500", className)} {...props} />;
}
