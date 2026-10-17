import type { ReactNode } from "react";
import { cn } from "./cn";
import { shadowSoft } from "./elevation";

export type FormErrorProps = {
  id: string;
  /** Keep the alert mounted so screen readers reliably announce text updates. */
  children?: ReactNode;
  className?: string;
  /** Collapse empty visual space while keeping the alert mounted. */
  collapsible?: boolean;
};

/** Form error alert; reference its id from associated fields. */
export function FormError({
  id,
  children,
  className,
  collapsible,
}: FormErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        collapsible && !children ? "-my-2" : "min-h-5",
        "text-sm font-semibold",
        children
          ? cn(
              "rounded-2xl bg-accent-peach px-3 py-2 text-neutral-900",
              shadowSoft.sm,
            )
          : "text-transparent",
        className,
      )}
    >
      {children}
    </p>
  );
}
