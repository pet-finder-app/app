import { Badge } from "@/components/ui";
import {
  DONATION_STATUS_TONES,
  donationStatusLabel,
  isDonationStatus,
} from "./donation-format";

type DonationStatusBadgeProps = { status: string };
export function DonationStatusBadge({ status }: DonationStatusBadgeProps) {
  return (
    <Badge
      size="sm"
      tone={
        isDonationStatus(status) ? DONATION_STATUS_TONES[status] : "outline"
      }
    >
      {donationStatusLabel(status)}
    </Badge>
  );
}
