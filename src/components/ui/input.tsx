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
    /** Trailing content inside the input, such as password visibility controls. */
    trailing?: ReactNode;
    /** Decorative leading input icon. */
    leading?: ReactNode;
  };

/** Standard text-like input control. */
export function Input({
  id,
  label,
  labelIcon,
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
    <Field
      id={id}
      label={label}
      labelIcon={labelIcon}
      hint={hint}
      hintId={hintId}
      tone={tone}
    >
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
