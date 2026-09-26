import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Base compartilhada por todos os campos do UI System: rótulo, dica e
 * associação de erro (aria-describedby / aria-invalid).
 *
 * `tone` escolhe as cores conforme o fundo: "primary" para as telas de
 * autenticação (fundo verde) e "light" para o resto do app.
 */

export type FieldTone = "primary" | "light";

export const fieldLabelClass: Record<FieldTone, string> = {
  primary: "text-sm font-semibold text-neutral-900",
  light: "text-sm font-semibold text-neutral-800",
};

export const fieldHintClass: Record<FieldTone, string> = {
  primary: "text-xs text-neutral-800",
  light: "text-xs text-neutral-500",
};

/**
 * Borda grossa preta + sombra dura de 2px; o foco "afunda" o campo
 * (some a sombra) em vez de só trocar a cor, reforçando o toque brutalista.
 */
const fieldControlBase =
  "w-full rounded-lg border-2 border-line bg-white px-4 py-3 text-sm text-neutral-900 shadow-[1px_1px_0_0_var(--color-line)] transition-shadow placeholder:text-neutral-500 focus-visible:shadow-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none aria-[invalid=true]:border-red-600 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-500 disabled:shadow-none disabled:opacity-60";

export const fieldControlClass: Record<FieldTone, string> = {
  primary: fieldControlBase,
  light: fieldControlBase,
};

export type FieldBaseProps = {
  id: string;
  label: string;
  /** Instrução visível e associada ao campo (ex.: "Mínimo de 6 caracteres."). */
  hint?: string;
  /** Marca o campo como inválido para leitores de tela (WCAG 4.1.2 / 3.3.1). */
  invalid?: boolean;
  /** Id de um elemento de erro externo (ex.: o alerta do formulário). */
  errorId?: string;
  tone?: FieldTone;
};

export function useFieldA11y({
  id,
  hint,
  invalid,
  errorId,
}: Pick<FieldBaseProps, "id" | "hint" | "invalid" | "errorId">) {
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [hintId, invalid ? errorId : undefined]
    .filter(Boolean)
    .join(" ");
  return {
    hintId,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy || undefined,
  };
}

type FieldProps = Pick<FieldBaseProps, "id" | "label" | "hint" | "tone"> & {
  hintId?: string;
  /** Quando true, o rótulo é um <span> (para inputs escondidos, ex.: file). */
  labelAsSpan?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({
  id,
  label,
  hint,
  hintId,
  tone = "light",
  labelAsSpan,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {labelAsSpan ? (
        <span className={fieldLabelClass[tone]}>{label}</span>
      ) : (
        <label htmlFor={id} className={fieldLabelClass[tone]}>
          {label}
        </label>
      )}
      {children}
      {hint ? (
        <p id={hintId} className={fieldHintClass[tone]}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
