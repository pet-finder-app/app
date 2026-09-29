import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";
import {
  Field,
  fieldControlClass,
  useFieldA11y,
  type FieldBaseProps,
} from "./field";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> &
  FieldBaseProps;

/** Campo de texto (text, email, password, number, date, tel...). */
export function Input({
  id,
  label,
  hint,
  invalid,
  errorId,
  tone = "light",
  className,
  ...props
}: InputProps) {
  const { hintId, ...a11y } = useFieldA11y({ id, hint, invalid, errorId });

  return (
    <Field id={id} label={label} hint={hint} hintId={hintId} tone={tone}>
      <input
        id={id}
        name={id}
        className={cn(fieldControlClass[tone], className)}
        {...a11y}
        {...props}
      />
    </Field>
  );
}
