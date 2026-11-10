"use client";
import { Button } from "@/components/ui";
import { applicationsOptions } from "@/lib/api/queries";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { APPLICATION_STATUS_LABELS } from "./labels";
import { QueryStatus } from "./query-status";

export function ApplicationList({
  organizationId,
  animalId,
}: {
  organizationId?: string;
  animalId?: string;
}) {
  const [page, setPage] = useState(1);
  const query = useQuery(applicationsOptions(organizationId, page));
  return (
    <>
      <QueryStatus query={query} />
      {query.data && !query.data.items.length ? (
        <p>Nenhum pedido de adoção encontrado.</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {query.data?.items
          .filter((item) => !animalId || item.animalId === animalId)
          .map((item) => (
            <li key={item.id} className="border-b border-border-light pb-3">
              <Link
                href={`${organizationId ? "/ngo/adoptions" : "/adopter/adoptions"}/${item.id}`}
                className="block"
              >
                <h2 className="font-bold">{item.animalName}</h2>
                <p>
                  {"adopterName" in item
                    ? item.adopterName
                    : item.organizationName}
                </p>
                <p>
                  {APPLICATION_STATUS_LABELS[item.status] ??
                    "Situação não informada"}
                </p>
              </Link>
            </li>
          ))}
      </ul>
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
          disabled={query.isFetching || (query.data?.items.length ?? 0) < 100}
          onClick={() => setPage(page + 1)}
        >
          Próxima
        </Button>
      </div>
    </>
  );
}
