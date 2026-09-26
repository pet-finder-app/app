import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Base compartilhada por todos os campos do UI System: rótulo, dica e
 * associação de erro (aria-describedby / aria-invalid).
 *
 * `tone` escolhe as cores conforme o fundo: "primary" para as telas de
 * autenticação (fundo verde), "light" para o resto do app (soft UI) e
 * "brutal" para as telas neo-brutalistas (Dashboard, Perfil, cadastro de
 * pet) — borda grossa `neutral-900`, sem sombra.
 */

export type FieldTone = "primary" | "light" | "brutal";

export const fieldLabelClass: Record<FieldTone, string> = {
  primary: "text-sm font-semibold text-neutral-900",
  light: "text-sm font-semibold text-neutral-800",
  brutal: "text-sm font-bold text-neutral-900",
};

export const fieldHintClass: Record<FieldTone, string> = {
  primary: "text-xs text-neutral-800",
  light: "text-xs text-neutral-500",
  brutal: "text-xs text-neutral-600",
};

/**
 * Borda fina e sombra bem suave; o foco troca a borda para o verde
 * primário e acrescenta um halo (`ring`) em vez de qualquer efeito de
 * "afundar" — só cor e leve profundidade.
 */
const fieldControlBase =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors placeholder:text-neutral-500 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200 disabled:opacity-60";

/** Mesma base, mas com a borda grossa `neutral-900` e sem sombra. */
const fieldControlBrutal =
  "w-full rounded-xl border border-neutral-900 bg-white px-4 py-3 text-sm text-neutral-900 transition-colors placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200 disabled:opacity-60";

export const fieldControlClass: Record<FieldTone, string> = {
  primary: fieldControlBase,
  light: fieldControlBase,
  brutal: fieldControlBrutal,
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
