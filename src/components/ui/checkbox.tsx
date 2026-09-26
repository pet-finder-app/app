import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import type { FieldTone } from "./field";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> & {
  id: string;
  /** Pode conter links (ex.: "Li e aceito os termos"). */
  label: ReactNode;
  invalid?: boolean;
  errorId?: string;
  tone?: FieldTone;
};

const labelClass: Record<FieldTone, string> = {
  primary: "text-neutral-900",
  light: "text-neutral-800",
};

export function Checkbox({
  id,
  label,
  invalid,
  errorId,
  tone = "light",
  className,
  ...props
}: CheckboxProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={id}
        name={id}
        type="checkbox"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        className="size-6 shrink-0 cursor-pointer rounded-sm border-2 border-line accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-red-500"
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "cursor-pointer py-0.5 text-sm leading-snug",
          labelClass[tone],
        )}
      >
        {label}
      </label>
    </div>
  );
}
