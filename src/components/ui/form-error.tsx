import type { ReactNode } from "react";
import { shadowBrutal } from "./brutal";
import { cn } from "./cn";

export type FormErrorProps = {
  id: string;
  /** Sempre montado: leitores de tela detectam a mudança de texto de forma
   *  mais confiável do que a inserção tardia de um novo nó. */
  children?: ReactNode;
  className?: string;
};

/** Alerta de erro do formulário. Passe o `id` como `errorId` dos campos. */
export function FormError({ id, children, className }: FormErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "min-h-5 text-sm font-semibold",
        children
          ? cn(
              "rounded-lg border-2 border-line bg-accent-peach px-3 py-2 text-neutral-900",
              shadowBrutal.sm,
            )
          : "text-transparent",
        className,
      )}
    >
      {children}
    </p>
  );
}
