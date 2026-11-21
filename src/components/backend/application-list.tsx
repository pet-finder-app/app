"use client";
import { Button } from "@/components/ui";
import { hasNextPage, pageCount } from "@/lib/api/pagination";
import { applicationsOptions } from "@/lib/api/queries";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { APPLICATION_STATUS_LABELS } from "./labels";
import { QueryStatus } from "./query-status";
import { VerifiedBadge } from "./verified-badge";

export function ApplicationList({
  organizationId,
  animalId,
}: {
  organizationId?: string;
  animalId?: string;
}) {
  const [page, setPage] = useState(1);
  const query = useQuery(
    applicationsOptions(organizationId, page, { animalId }),
  );
  const meta = query.data?.page;
  const pages = meta ? pageCount(meta) : 1;
  return (
    <>
      <QueryStatus query={query} />
      {query.data && !query.data.items.length ? (
        <p>Nenhum pedido de adoção encontrado.</p>
      ) : null}
      {meta && meta.total ? (
        <p className="text-sm text-neutral-600">
          {meta.total === 1 ? "1 pedido · " : `${meta.total} pedidos · `}
          Página {meta.page} de {pages}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {query.data?.items.map((item) => (
          <li key={item.id} className="border-b border-border-light pb-3">
            <Link
              href={`${organizationId ? "/ngo/adoptions" : "/adopter/adoptions"}/${item.id}`}
              className="block"
            >
              <h2 className="font-bold">{item.animalName}</h2>
              {"adopterName" in item ? (
                <p className="flex flex-wrap items-center gap-2">
                  {item.adopterName}
                  <VerifiedBadge status={item.adopterVerificationStatus} />
                </p>
              ) : (
                <p>{item.organizationName}</p>
              )}
              <p>
                {APPLICATION_STATUS_LABELS[item.status] ??
                  "Situação não informada"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 || page > 1 ? (
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={page === 1 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={query.isFetching || !meta || !hasNextPage(meta)}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}
    </>
  );
}
