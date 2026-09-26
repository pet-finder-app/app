import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type PageShellProps = HTMLAttributes<HTMLElement> & {
  /** Largura máxima do conteúdo. "sm" para autenticação, "md" para o app,
   *  "lg" para textos longos (termos). */
  width?: "sm" | "md" | "lg";
  /** Reserva espaço para uma `ActionBar` fixa no rodapé. */
  hasActionBar?: boolean;
  /** Fundo: neutro (padrão) ou o verde primário (autenticação). */
  background?: "neutral" | "primary";
  children: ReactNode;
};

const widths = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

/**
 * Moldura padrão de página: fundo, gutter de 16px no celular, conteúdo
 * centralizado com largura máxima. Tudo que aparece na tela fica dentro
 * dela — cabeçalhos inclusive — para nada "vazar" do quadro.
 */
export function PageShell({
  width = "md",
  hasActionBar = false,
  background = "neutral",
  className,
  children,
  ...props
}: PageShellProps) {
  return (
    <main
      className={cn(
        "flex min-h-dvh flex-col px-4 py-6",
        background === "primary" ? "bg-primary" : "bg-neutral-100",
        hasActionBar && "pb-32",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col gap-4",
          widths[width],
        )}
      >
        {children}
      </div>
    </main>
  );
}

/**
 * Barra fixa no rodapé para ações do formulário. Alinha com a mesma
 * largura da `PageShell` e respeita a área segura de celulares com notch.
 */
export function ActionBar({
  width = "md",
  className,
  children,
}: {
  width?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 border-t border-neutral-100 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className={cn("mx-auto flex w-full flex-col gap-2", widths[width])}>
        {children}
      </div>
    </div>
  );
}
