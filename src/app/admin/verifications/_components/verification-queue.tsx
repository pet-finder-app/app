"use client";
import {
  formatDate,
  SUBMISSION_STATUS_LABELS,
} from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { Select } from "@/components/ui";
import { verificationQueueOptions } from "@/lib/api/queries";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

const FILTERS = [
  { value: "submitted", label: "Aguardando análise" },
  { value: "under_review", label: "Em análise" },
  { value: "approved", label: "Aprovadas" },
  { value: "rejected", label: "Recusadas" },
];

export function VerificationQueue() {
  const [status, setStatus] = useState("submitted");
  const query = useQuery(verificationQueueOptions(status));
  return (
    <>
      <Select
        id="verification-filter"
        label="Situação"
        value={status}
        options={FILTERS}
        onChange={(event) => setStatus(event.target.value)}
      />
      <QueryStatus query={query} />
      {query.data && query.data.items.length === 0 ? (
        <p>Nenhuma verificação nesta situação.</p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {query.data?.items.map((item) => (
          <li key={item.verification.id}>
            <Link
              href={`/admin/verifications/${item.verification.id}`}
              className="flex flex-col rounded-xl border border-border-light p-3"
            >
              <span className="font-bold">
                {item.organizationId ? "Organização" : "Pessoa"}
              </span>
              <span>
                {SUBMISSION_STATUS_LABELS[item.verification.status] ??
                  item.verification.status}{" "}
                · {formatDate(item.verification.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
