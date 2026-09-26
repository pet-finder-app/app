import type { TextareaHTMLAttributes } from "react";
import { cn } from "./cn";
import {
  Field,
  fieldControlClass,
  useFieldA11y,
  type FieldBaseProps,
} from "./field";

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> &
  FieldBaseProps;

export function Textarea({
  id,
  label,
  hint,
  invalid,
  errorId,
  tone = "light",
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  const { hintId, ...a11y } = useFieldA11y({ id, hint, invalid, errorId });

  return (
    <Field id={id} label={label} hint={hint} hintId={hintId} tone={tone}>
      <textarea
        id={id}
        name={id}
        rows={rows}
        className={cn(fieldControlClass[tone], "resize-y", className)}
        {...a11y}
        {...props}
      />
    </Field>
  );
}
