import { Badge } from "@/components/ui";
import { iconSize } from "@/components/ui/icon";
import { BadgeCheck } from "lucide-react";

type VerifiedBadgeProps = { status: string | null | undefined };

/** Marks a person or organization whose identity Petfinder verified. */
export function VerifiedBadge({ status }: VerifiedBadgeProps) {
  if (status !== "verified") return null;
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
