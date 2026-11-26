import { Badge } from "@/components/ui";
import { iconSize } from "@/components/ui/icon";
import { BadgeCheck, Badge as BadgeShape, Check } from "lucide-react";

type VerifiedBadgeProps = {
  status: string | null | undefined;
  /** Show only the check mark, e.g. beside the person's own name. */
  isIconOnly?: boolean;
};

/** Marks a person or organization whose identity Petfinder verified. */
export function VerifiedBadge({
  status,
  isIconOnly = false,
}: VerifiedBadgeProps) {
  if (status !== "verified") return null;
  if (isIconOnly)
    return (
      <span
        role="img"
        aria-label="Identidade verificada pela Petfinder"
        title="Identidade verificada pela Petfinder"
        className="relative inline-flex size-5 shrink-0 -translate-y-px items-center justify-center text-accent-tertiary"
      >
        <BadgeShape
          className="absolute inset-0 size-full fill-current"
          aria-hidden="true"
        />
        <Check
          className="relative size-2.5 text-white"
          strokeWidth={3.5}
          aria-hidden="true"
        />
      </span>
    );
  return (
    <Badge
      tone="success"
      size="sm"
      title="Identidade verificada pela Petfinder"
    >
      <BadgeCheck className={iconSize.sm} aria-hidden="true" />
      Verificado
    </Badge>
  );
}
