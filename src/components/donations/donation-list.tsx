"use client";
import { formatDate } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { Button } from "@/components/ui";
import { donationsOptions } from "@/lib/api/donations";
import type { DonationResponse } from "@/lib/backend/contracts";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { DonationDecisionSheet } from "./donation-decision-sheet";
import { formatBrl } from "./donation-format";
import { DonationPager } from "./donation-pager";
import { DonationStatusBadge } from "./donation-status-badge";
import { donorLabel } from "./donor-label";

type DonationListProps = {
  /** Set for the organization view; omitted for the donor's own reports. */
  organizationId?: string;
};

type PendingDecision = {
  donation: DonationResponse;
  status: "confirmed" | "not_found";
};

export function DonationList({ organizationId }: DonationListProps) {
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<PendingDecision | null>(null);
  const query = useQuery({
    ...donationsOptions(organizationId, page),
    placeholderData: keepPreviousData,
  });
  const items = query.data?.items ?? [];
  const meta = query.data?.page;
  const basePath = organizationId
    ? "/ngo/donations"
    : "/adopter/donate/history";

  return (
    <>
      <QueryStatus query={query} />
      {meta?.total === 0 ? (
        <p>
          {organizationId
            ? "Nenhuma doação informada para esta ONG ainda."
            : "Você ainda não informou nenhuma doação."}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((donation) => (
          <li
            key={donation.id}
            className="flex flex-col gap-2 border-b border-border-light pb-3"
          >
            <Link
              href={`${basePath}/${encodeURIComponent(donation.id)}`}
              className="flex flex-col gap-1"
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-lg font-bold">
                  {formatBrl(donation.amountCents)}
                </span>
                <DonationStatusBadge status={donation.status} />
              </span>
              <span>
                {organizationId
                  ? donorLabel(donation)
                  : donation.organizationName}
              </span>
              <span className="text-sm text-neutral-600">
                Transferido em {formatDate(donation.transferredAt)}
              </span>
            </Link>
            {organizationId && donation.status === "reported" ? (
              <div className="flex gap-3">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setDecision({ donation, status: "confirmed" })}
                >
                  Confirmar recebimento
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDecision({ donation, status: "not_found" })}
                >
                  Não localizada
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {meta && meta.total > 0 ? (
        <DonationPager
          meta={meta}
          noun={{ one: "doação", other: "doações" }}
          label={
            organizationId ? "Páginas de doações" : "Páginas de minhas doações"
          }
          isFetching={query.isFetching}
          onPageChange={setPage}
        />
      ) : null}
      {decision ? (
        <DonationDecisionSheet
          donation={decision.donation}
          status={decision.status}
          onClose={() => setDecision(null)}
        />
      ) : null}
    </>
  );
}
