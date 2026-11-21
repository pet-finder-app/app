"use client";
import { formatDate } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { Button } from "@/components/ui";
import { surrendersOptions } from "@/lib/api/workflows";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { SURRENDER_KIND_LABELS, SURRENDER_STATUS_LABELS } from "./labels";

type SurrenderListProps = {
  /** Omit for the requester's own cases. */
  organizationId?: string;
};

/** Intake and return cases of the requester or of an organization. */
export function SurrenderList({ organizationId }: SurrenderListProps) {
  const query = useInfiniteQuery(surrendersOptions(organizationId));
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.page.total ?? 0;
  const base = organizationId ? "/ngo/surrenders" : "/adopter/surrenders";
  return (
    <>
      <QueryStatus query={query} />
      {query.data && !items.length ? (
        <p>Nenhuma solicitação de entrega ou devolução.</p>
      ) : null}
      {items.length ? (
        <p className="text-sm text-neutral-600">
          {total === 1 ? "1 solicitação" : `${total} solicitações`}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="border-b border-border-light pb-3">
            <Link
              href={`${base}/${encodeURIComponent(item.id)}`}
              className="block focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <h2 className="font-bold">{item.animal.name}</h2>
              <p>
                {SURRENDER_KIND_LABELS[item.kind] ?? "Entrega"} ·{" "}
                {organizationId
                  ? `Solicitante ${item.requesterName}`
                  : `ONG ${item.organizationName}`}
              </p>
              <p>
                {SURRENDER_STATUS_LABELS[item.status] ??
                  "Situação não informada"}{" "}
                · {formatDate(item.createdAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {query.hasNextPage ? (
        <Button
          variant="outline"
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Carregar mais ({items.length} de {total})
        </Button>
      ) : null}
    </>
  );
}
