import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import {
  Field,
  fieldControlClass,
  useFieldA11y,
  type FieldBaseProps,
} from "./field";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> &
  FieldBaseProps & {
    /** Elemento à direita, dentro do campo (ex.: mostrar/ocultar senha). */
    trailing?: ReactNode;
    /** Ícone decorativo à esquerda, dentro do campo. */
    leading?: ReactNode;
  };

/** Campo de texto (text, email, password, number, date, tel...). */
export function Input({
  id,
  label,
  hint,
  invalid,
  errorId,
  tone = "light",
  trailing,
  leading,
  className,
  ...props
}: InputProps) {
  const { hintId, ...a11y } = useFieldA11y({ id, hint, invalid, errorId });

  return (
    <Field id={id} label={label} hint={hint} hintId={hintId} tone={tone}>
      <div className="relative">
        <input
          id={id}
          name={id}
          className={cn(
            fieldControlClass[tone],
            trailing ? "pr-12" : undefined,
            leading ? "pl-11" : undefined,
            className,
          )}
          {...a11y}
          {...props}
        />
        {leading ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-neutral-600"
          >
            {leading}
          </div>
        ) : null}
        {trailing ? (
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            {trailing}
          </div>
        ) : null}
      </div>
    </Field>
  );
}
