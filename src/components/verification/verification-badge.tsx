import {
  Badge,
  cn,
  iconSize,
  type BadgeSize,
  type BadgeTone,
} from "@/components/ui";
import { VERIFICATION_STATUS_LABEL, type VerificationStatus } from "@/lib/ngo";
import { Badge as BadgeIcon, Check } from "lucide-react";

const TONE: Record<VerificationStatus, BadgeTone> = {
  pending: "warning",
  under_review: "info",
  verified: "success",
  suspended: "danger",
};

/** Verification badge shared by NGO and adopter profiles. Labels may be overridden. Compact icon-only badges appear only for verified accounts; other statuses have dedicated notices. */
export function VerificationBadge({
  status,
  label,
  size = "md",
  compact = false,
  className,
}: {
  status: VerificationStatus;
  label?: string;
  size?: BadgeSize;
  compact?: boolean;
  className?: string;
}) {
  const text = label ?? VERIFICATION_STATUS_LABEL[status];

  if (compact) {
    if (status !== "verified") return null;
    return (
      <span
        role="img"
        aria-label={text}
        title={text}
        className={cn(
          "relative inline-flex size-4 shrink-0 items-center justify-center",
          className,
        )}
      >
        <BadgeIcon
          className="absolute inset-0 size-full"
          fill="var(--color-accent)"
          stroke="var(--color-accent)"
          aria-hidden="true"
        />
        <Check
          className="relative size-1/2"
          stroke="var(--color-text)"
          strokeWidth={4}
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <Badge tone={TONE[status]} size={size} className={className}>
      {status === "verified" ? (
        <Check className={iconSize.sm} aria-hidden="true" />
      ) : null}
      {text}
    </Badge>
  );
}
