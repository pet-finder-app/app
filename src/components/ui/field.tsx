import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";

/** Shared field labels, hints, and accessible error associations. Tone selects colors appropriate to the surrounding surface. */

export type FieldTone = "primary" | "light" | "brutal" | "photo";

export const fieldLabelClass: Record<FieldTone, string> = {
  photo: "text-base font-semibold text-text-light",
  primary: "text-sm font-semibold text-neutral-900",
  light: "text-sm font-semibold text-neutral-900",
  brutal: "text-sm font-bold text-neutral-900",
};

export const fieldHintClass: Record<FieldTone, string> = {
  photo: "text-xs text-text-light/85",
  primary: "text-xs text-neutral-900",
  light: "text-xs text-neutral-600",
  brutal: "text-xs text-neutral-600",
};

/** Thin border, subtle shadow, and a primary focus ring. */
const fieldControlBase =
  "w-full rounded-2xl border border-border-light bg-white px-4 py-3 text-sm text-neutral-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors placeholder:text-neutral-600 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-400 disabled:opacity-60";

/** Dark-border variant without a shadow. */
const fieldControlBrutal =
  "w-full rounded-xl border border-neutral-900 bg-white px-4 py-3 text-sm text-neutral-900 transition-colors placeholder:text-neutral-600 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-400 disabled:opacity-60";

/** Authentication field variant with a dark border for contrast on green surfaces. */
const fieldControlPrimary = fieldControlBase
  .replace("border-border-light", "border-neutral-900")
  .replace(
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
    "focus-visible:border-neutral-900 focus-visible:ring-4 focus-visible:ring-lime-800/40",
  );

export const fieldControlClass: Record<FieldTone, string> = {
  photo:
    "min-h-13 w-full rounded-[0.625rem] border border-border-light bg-bg-white px-3.5 py-3 text-base text-text transition-colors placeholder:text-text/55 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-400 disabled:opacity-60",
  primary: fieldControlPrimary,
  light: fieldControlBase,
  brutal: fieldControlBrutal,
};

export type FieldBaseProps = {
  id: string;
  label: string;
  /** Decorative icon beside the visible label. */
  labelIcon?: LucideIcon;
  /** Visible instructions associated with the field. */
  hint?: string;
  /** Expose invalid state to assistive technology. */
  invalid?: boolean;
  /** Identifier of an external error message. */
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

type FieldProps = Pick<
  FieldBaseProps,
  "id" | "label" | "labelIcon" | "hint" | "tone"
> & {
  hintId?: string;
  /** Use a span label for hidden inputs such as file controls. */
  labelAsSpan?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({
  id,
  label,
  labelIcon: LabelIcon,
  hint,
  hintId,
  tone = "light",
  labelAsSpan,
  children,
  className,
}: FieldProps) {
  const labelContent = LabelIcon ? (
    <>
      <LabelIcon
        className="mr-1.5 inline size-4 align-text-bottom"
        aria-hidden="true"
      />
      {label}
    </>
  ) : (
    label
  );

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {labelAsSpan ? (
        <span className={fieldLabelClass[tone]}>{labelContent}</span>
      ) : (
        <label htmlFor={id} className={fieldLabelClass[tone]}>
          {labelContent}
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
