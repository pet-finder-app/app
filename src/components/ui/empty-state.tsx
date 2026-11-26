import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";

export type EmptyStateProps = {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
};

/** Greyed-out icon and message centered in the space left on the page. */
export function EmptyState({
  icon: Icon,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center text-sm text-neutral-600",
        className,
      )}
    >
      <Icon
        className="size-10 text-neutral-400"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <p>{children}</p>
    </div>
  );
}
