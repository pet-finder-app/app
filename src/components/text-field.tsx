import type { InputHTMLAttributes } from "react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  /** Instrução visível e associada ao campo (ex.: "Mínimo de 6 caracteres."). */
  hint?: string;
  /** Marca o campo como inválido para leitores de tela (WCAG 4.1.2 / 3.3.1). */
  invalid?: boolean;
  /** Id de um elemento de erro externo (ex.: o alerta do formulário) a
   *  associar via aria-describedby, além da dica. */
  errorId?: string;
};

export function TextField({
  id,
  label,
  hint,
  invalid,
  errorId,
  className,
  ...props
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [hintId, invalid ? errorId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-white">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy || undefined}
        className={
          className ??
          "w-full rounded-lg bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-500"
        }
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-neutral-300">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
