import type { DonationResponse } from "@/lib/backend/contracts";

/** Go omits the identity of anonymous donors from organization projections. */
export function donorLabel(
  donation: Pick<DonationResponse, "anonymous" | "donorName">,
): string {
  if (donation.donorName) return donation.donorName;
  return donation.anonymous ? "Doação anônima" : "Doador não informado";
}
