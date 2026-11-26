import { Loader2 } from "lucide-react";
import { cn } from "./cn";

export type LoadingStateProps = {
  /** Announced to assistive technology. */
  label?: string;
  className?: string;
};

/** Grey spinner centered in the space left on the page while content loads. */
export function LoadingState({
  label = "Carregando...",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-1 items-center justify-center px-4 py-8",
        className,
      )}
    >
      <Loader2
        className="size-8 text-neutral-400 motion-safe:animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
