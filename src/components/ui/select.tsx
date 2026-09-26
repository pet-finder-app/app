import type { SelectHTMLAttributes } from "react";
import { cn } from "./cn";
import {
  Field,
  fieldControlClass,
  useFieldA11y,
  type FieldBaseProps,
} from "./field";

export type SelectOption = { value: string; label: string };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> &
  FieldBaseProps & {
    options: SelectOption[];
    /** Primeira opção, desabilitada (ex.: "Selecione..."). */
    placeholder?: string;
  };

export function Select({
  id,
  label,
  hint,
  invalid,
  errorId,
  tone = "light",
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  const { hintId, ...a11y } = useFieldA11y({ id, hint, invalid, errorId });

  return (
    <Field id={id} label={label} hint={hint} hintId={hintId} tone={tone}>
      <select
        id={id}
        name={id}
        className={cn(
          fieldControlClass[tone],
          'bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27 fill=%27none%27 stroke=%27%23000000%27 stroke-width=%273%27><path d=%27M6 8l4 4 4-4%27/></svg>")] appearance-none bg-[length:1.25rem] bg-[position:right_0.75rem_center] bg-no-repeat pr-10',
          className,
        )}
        {...a11y}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
