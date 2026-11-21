"use client";
import { QueryStatus } from "@/components/backend/query-status";
import { LinkButton } from "@/components/ui";
import { paymentDetailsOptions } from "@/lib/api/queries";
import { useQuery } from "@tanstack/react-query";
import { DonationDisclaimer } from "./donation-disclaimer";
import { DonationReportForm } from "./donation-report-form";
import { PaymentInstructions } from "./payment-instructions";

type DonateToOrganizationProps = {
  organizationId: string;
  organizationName: string;
};

export function DonateToOrganization({
  organizationId,
  organizationName,
}: DonateToOrganizationProps) {
  const query = useQuery(paymentDetailsOptions(organizationId));
  // Go returns unpublished drafts to the organization's own managers, but only
  // published details accept donation reports.
  const details = query.data?.published ? query.data : null;
  return (
    <div className="flex flex-col gap-4">
      <DonationDisclaimer />
      <QueryStatus query={query} />
      {query.isSuccess && !details ? (
        <div className="flex flex-col gap-3">
          <p role="status">
            {organizationName} ainda não publicou dados para doação no
            Petfinder. Procure os canais oficiais da ONG ou escolha outra
            organização.
          </p>
          <LinkButton href="/adopter/donate" variant="outline">
            Ver outras ONGs
          </LinkButton>
        </div>
      ) : null}
      {details ? (
        <>
          <PaymentInstructions details={details} />
          <DonationReportForm
            organizationId={organizationId}
            organizationName={organizationName}
          />
        </>
      ) : null}
    </div>
  );
}
