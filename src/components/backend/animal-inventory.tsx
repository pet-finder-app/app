"use client";

import { Button, LinkButton, Select } from "@/components/ui";
import { queryKeys } from "@/lib/api/keys";
import { animalInventoryOptions } from "@/lib/api/queries";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { ANIMAL_STATUS_LABELS } from "./labels";
import { QueryStatus } from "./query-status";

const statusSchema = z.enum([
  "all",
  "pending_organization",
  "available",
  "adoption_in_progress",
  "adopted",
  "unavailable",
  "under_review",
]);
type AnimalInventoryProps = { organizationId?: string };

export function AnimalInventory({ organizationId }: AnimalInventoryProps) {
  const client = useQueryClient();
  const [status, setStatus] = useState<z.output<typeof statusSchema>>("all");
  const filter = status === "all" ? undefined : status;
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.inventory(organizationId, filter), "pages"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      client.fetchQuery(
        animalInventoryOptions(organizationId, filter, pageParam),
      ),
    getNextPageParam: (last, _pages, page) =>
      last.items.length === 20 ? page + 1 : undefined,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <>
      {organizationId ? (
        <Select
          id="inventory-status"
          label="Situação do animal"
          value={status}
          options={statusSchema.options.map((value) => ({
            value,
            label:
              value === "all"
                ? "Todas as situações"
                : ANIMAL_STATUS_LABELS[value],
          }))}
          onChange={(event) =>
            setStatus(statusSchema.parse(event.target.value))
          }
        />
      ) : null}
      <QueryStatus query={query} />
      {query.data && !items.length ? <p>Nenhum animal encontrado.</p> : null}
      <ul className="flex flex-col gap-4">
        {items.map((animal) => (
          <li
            key={animal.id}
            className="flex min-w-0 flex-col gap-2 border-b border-border-light pb-4"
          >
            <h2 className="text-lg font-bold break-words">{animal.name}</h2>
            <p>
              {ANIMAL_STATUS_LABELS[animal.status] ?? "Situação não informada"}
            </p>
            <p>
              {animal.city} · {animal.stateCode}
            </p>
            {animal.organizationReviewNotes ? (
              <p>Resposta da ONG: {animal.organizationReviewNotes}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <LinkButton variant="outline" href={`/pets/${animal.id}`}>
                Ver animal
              </LinkButton>
              <LinkButton
                variant="outline"
                href={`/ngo/pets/${animal.id}/edit`}
              >
                Editar animal
              </LinkButton>
            </div>
          </li>
        ))}
      </ul>
      {query.hasNextPage ? (
        <Button
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Carregar mais animais
        </Button>
      ) : null}
    </>
  );
}
