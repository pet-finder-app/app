import type { ReactNode } from "react";
import { cn } from "./cn";
import { shadowSoft } from "./elevation";

export type FormErrorProps = {
  id: string;
  /** Sempre montado: leitores de tela detectam a mudança de texto de forma
   *  mais confiável do que a inserção tardia de um novo nó. */
  children?: ReactNode;
  className?: string;
  /** Sem texto, não ocupa espaço (continua montado para leitores de tela). */
  collapsible?: boolean;
};

/** Alerta de erro do formulário. Passe o `id` como `errorId` dos campos. */
export function FormError({
  id,
  children,
  className,
  collapsible,
}: FormErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        collapsible && !children ? "-my-2" : "min-h-5",
        "text-sm font-semibold",
        children
          ? cn(
              "rounded-2xl bg-accent-peach px-3 py-2 text-neutral-900",
              shadowSoft.sm,
            )
          : "text-transparent",
        className,
      )}
    >
      {children}
    </p>
  );
}
