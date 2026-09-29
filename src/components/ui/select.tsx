import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "./cn";
import {
  Field,
  fieldControlClass,
  useFieldA11y,
  type FieldBaseProps,
  type FieldTone,
} from "./field";

export type SelectOption = { value: string; label: string };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> &
  FieldBaseProps & {
    options: SelectOption[];
    /** Primeira opção, desabilitada (ex.: "Selecione..."). */
    placeholder?: string;
  };

const chevronClass: Record<FieldTone, string> = {
  primary: "text-neutral-600",
  light: "text-neutral-600",
  brutal: "text-neutral-900",
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
      <div className="relative">
        <select
          id={id}
          name={id}
          className={cn(
            fieldControlClass[tone],
            "appearance-none pr-10",
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
        <ChevronDown
          className={cn(
            "pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2",
            chevronClass[tone],
          )}
          aria-hidden="true"
        />
      </div>
    </Field>
  );
}
