import { cn } from "./cn";

export type ProgressProps = {
  value: number;
  max: number;
  /** Nome lido por leitores de tela. */
  label: string;
  className?: string;
};

/** Barra de progresso simples, sem texto — combine com um contador ao lado. */
export function Progress({ value, max, label, className }: ProgressProps) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={cn(
        "h-2.5 overflow-hidden rounded-full bg-neutral-100",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
