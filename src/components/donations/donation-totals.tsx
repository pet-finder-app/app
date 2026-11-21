"use client";
import { QueryStatus } from "@/components/backend/query-status";
import { donationTotalsOptions } from "@/lib/api/donations";
import { useQuery } from "@tanstack/react-query";
import { formatBrl } from "./donation-format";

type DonationTotalsProps = { organizationId: string };

/** Reported, confirmed and not-found sums, kept separate as Go returns them. */
export function DonationTotals({ organizationId }: DonationTotalsProps) {
  const query = useQuery(donationTotalsOptions(organizationId));
  const totals = query.data;
  return (
    <section aria-labelledby="donation-totals" className="flex flex-col gap-3">
      <h2 id="donation-totals" className="text-lg font-bold">
        Totais
      </h2>
      <QueryStatus query={query} />
      {totals ? (
        <dl className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-3">
          <Total label="Confirmado" cents={totals.confirmedCents} />
          <Total label="Aguardando conferência" cents={totals.reportedCents} />
          <Total label="Não localizado" cents={totals.notFoundCents} />
        </dl>
      ) : null}
    </section>
  );
}

function Total({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="rounded-2xl border border-border-light p-3">
      <dt className="text-sm text-neutral-600">{label}</dt>
      <dd className="text-lg font-bold">{formatBrl(cents)}</dd>
    </div>
  );
}
