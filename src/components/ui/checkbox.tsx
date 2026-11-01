import { Check, type LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import type { FieldTone } from "./field";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> & {
  id: string;
  /** Checkbox label may contain inline links. */
  label: ReactNode;
  /** Decorative icon beside the visible label. */
  labelIcon?: LucideIcon;
  invalid?: boolean;
  errorId?: string;
  tone?: FieldTone;
  /** Defaults to an accent background and theme-black checkmark when checked. */
  variant?: "default" | "filled" | "chip";
};

const labelClass: Record<FieldTone, string> = {
  photo: "text-text-light",
  primary: "text-neutral-900",
  light: "text-neutral-900",
  brutal: "text-neutral-900",
};

const boxClass: Record<FieldTone, string> = {
  photo: "border-border-light",
  primary: "border-stone-300",
  light: "border-border-light",
  brutal: "border-neutral-900",
};

export function Checkbox({
  id,
  label,
  labelIcon: LabelIcon,
  invalid,
  errorId,
  tone = "light",
  variant = "filled",
  className,
  ...props
}: CheckboxProps) {
  if (variant === "chip") {
    return (
      <div className={cn("relative inline-flex max-w-full", className)}>
        <input
          id={id}
          name={id}
          type="checkbox"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className="peer sr-only"
          {...props}
        />
        <label
          htmlFor={id}
          className="inline-flex min-h-10 min-w-0 cursor-pointer items-center rounded-full border border-border-light bg-white px-3 py-2 text-sm font-medium text-text transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-tertiary peer-disabled:cursor-not-allowed peer-disabled:opacity-50 hover:bg-secondary motion-reduce:transition-none"
        >
          {LabelIcon ? (
            <LabelIcon className="mr-1.5 size-4 shrink-0" aria-hidden="true" />
          ) : null}
          {label}
        </label>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="relative size-6 shrink-0">
        <input
          id={id}
          name={id}
          type="checkbox"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={cn(
            "peer block size-6 cursor-pointer appearance-none rounded-md border bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-red-500",
            boxClass[tone],
            variant === "filled" && "checked:bg-accent",
          )}
          {...props}
        />
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className={cn(
            "pointer-events-none absolute inset-0 m-auto size-4 opacity-0 peer-checked:opacity-100",
            variant === "filled" ? "text-text" : "text-primary",
          )}
        />
      </span>
      <label
        htmlFor={id}
        className={cn(
          "cursor-pointer py-0.5 text-sm leading-snug",
          labelClass[tone],
        )}
      >
        {LabelIcon ? (
          <LabelIcon
            className="mr-1.5 inline size-4 align-text-bottom"
            aria-hidden="true"
          />
        ) : null}
        {label}
      </label>
    </div>
  );
}
