"use client";
import { formatDate, mediaHref } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { Button } from "@/components/ui";
import { donationOptions } from "@/lib/api/donations";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DonationDecisionSheet } from "./donation-decision-sheet";
import { donationStatusLabel, formatBrl } from "./donation-format";
import { DonationStatusBadge } from "./donation-status-badge";
import { donorLabel } from "./donor-label";

type DonationDetailProps = {
  donationId: string;
  /** Organization view: show the donor and the decision actions. */
  isOrganizationView?: boolean;
};

export function DonationDetail({
  donationId,
  isOrganizationView = false,
}: DonationDetailProps) {
  const query = useQuery(donationOptions(donationId));
  const [decision, setDecision] = useState<"confirmed" | "not_found" | null>(
    null,
  );
  if (!query.data) return <QueryStatus query={query} />;
  const { donation, history } = query.data;
  const receipt = donation.receiptMediaId
    ? mediaHref(`/v1/media/${donation.receiptMediaId}`)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-2xl font-bold">{formatBrl(donation.amountCents)}</p>
        <DonationStatusBadge status={donation.status} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="font-bold">ONG</dt>
        <dd>{donation.organizationName}</dd>
        <dt className="font-bold">
          {isOrganizationView ? "Doador" : "Identificação"}
        </dt>
        <dd>
          {isOrganizationView
            ? donorLabel(donation)
            : donation.anonymous
              ? "Anônima: a ONG não vê seu nome"
              : "A ONG vê seu nome"}
        </dd>
        <dt className="font-bold">Transferência</dt>
        <dd>{formatDate(donation.transferredAt)}</dd>
        <dt className="font-bold">Informada em</dt>
        <dd>{formatDate(donation.createdAt)}</dd>
        <dt className="font-bold">Comprovante</dt>
        <dd>
          {receipt ? (
            <a
              href={receipt}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline"
            >
              Abrir comprovante
            </a>
          ) : (
            "Não enviado"
          )}
        </dd>
        {donation.note ? (
          <>
            <dt className="font-bold">Mensagem</dt>
            <dd className="whitespace-pre-wrap">{donation.note}</dd>
          </>
        ) : null}
        {donation.decisionReason ? (
          <>
            <dt className="font-bold">Resposta da ONG</dt>
            <dd className="whitespace-pre-wrap">{donation.decisionReason}</dd>
          </>
        ) : null}
      </dl>
      {isOrganizationView && donation.status === "reported" ? (
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => setDecision("confirmed")}>
            Confirmar recebimento
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setDecision("not_found")}
          >
            Não localizada
          </Button>
        </div>
      ) : null}
      {!isOrganizationView && donation.status === "reported" ? (
        <p role="note" className="text-sm text-neutral-600">
          A ONG ainda vai conferir o extrato. Você verá aqui quando ela
          confirmar ou não localizar a transferência.
        </p>
      ) : null}
      <section
        aria-labelledby="donation-history"
        className="flex flex-col gap-2"
      >
        <h2 id="donation-history" className="text-lg font-bold">
          Histórico
        </h2>
        <ol className="flex flex-col gap-2">
          <li className="border-b border-border-light pb-2">
            <p className="font-semibold">Transferência informada</p>
            <p className="text-sm text-neutral-600">
              {formatDate(donation.createdAt)}
            </p>
          </li>
          {history.map((record) => (
            <li
              key={`${record.createdAt}-${record.status}`}
              className="border-b border-border-light pb-2"
            >
              <p className="font-semibold">
                {donationStatusLabel(record.status)}
              </p>
              <p className="text-sm text-neutral-600">
                {formatDate(record.createdAt)}
              </p>
              {record.reason ? (
                <p className="whitespace-pre-wrap">{record.reason}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
      {decision ? (
        <DonationDecisionSheet
          donation={donation}
          status={decision}
          onClose={() => setDecision(null)}
        />
      ) : null}
    </div>
  );
}
