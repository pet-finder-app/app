import { cn } from "@/components/ui";
import type { HTMLAttributes } from "react";

/**
 * Estilo neo-brutalista de algumas telas (dashboard, perfil): borda fina
 * neutral-900, sem sombra — diferente do soft UI (sombra suave, sem
 * borda) do resto do app.
 */
type BrutalCardProps = HTMLAttributes<HTMLElement> & {
  /** Elemento semântico do cartão: section (padrão), header, article... */
  as?: "section" | "header" | "article" | "div";
};

/** Cartão com borda fina neutral-900 — o "Card" dessas telas. */
export function BrutalCard({
  as: Tag = "section",
  className,
  ...props
}: BrutalCardProps) {
  return (
    <Tag
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-neutral-900 bg-white p-5",
        className,
      )}
      {...props}
    />
  );
}
