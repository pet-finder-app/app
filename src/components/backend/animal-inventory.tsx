"use client";

import { LIFECYCLE_STATUS_LABELS } from "@/components/animals/animal-labels";
import {
  canReassignOrganization,
  ReassignOrganizationSheet,
} from "@/components/animals/reassign-organization-sheet";
import { Badge, Button, LinkButton, Select } from "@/components/ui";
import { animalQueries, INVENTORY_STATUSES } from "@/lib/api/animals";
import { queryKeys } from "@/lib/api/keys";
import { nextPageParam } from "@/lib/api/pagination";
import type { Animal } from "@/lib/backend/contracts";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { QueryStatus } from "./query-status";

const statusSchema = z.enum(["all", ...INVENTORY_STATUSES]);
type AnimalInventoryProps = {
  organizationId?: string;
  /** Advertiser inventory: enables reassignment of the caller's submissions. */
  userId?: string;
};

export function AnimalInventory({
  organizationId,
  userId,
}: AnimalInventoryProps) {
  const client = useQueryClient();
  const [status, setStatus] = useState<z.output<typeof statusSchema>>("all");
  const [reassigning, setReassigning] = useState<Animal | null>(null);
  const filter = status === "all" ? undefined : status;
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.inventory(organizationId, filter), "pages"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      client.fetchQuery(
        animalQueries.inventory(organizationId, filter, pageParam),
      ),
    getNextPageParam: nextPageParam,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages.at(-1)?.page.total ?? 0;
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
                : LIFECYCLE_STATUS_LABELS[value],
          }))}
          onChange={(event) =>
            setStatus(statusSchema.parse(event.target.value))
          }
        />
      ) : null}
      <QueryStatus query={query} />
      {query.data && !items.length ? <p>Nenhum animal encontrado.</p> : null}
      {items.length ? (
        <p className="text-sm text-neutral-600">
          {total === 1
            ? "1 animal"
            : `${total.toLocaleString("pt-BR")} animais`}
          {items.length < total
            ? ` · ${items.length.toLocaleString("pt-BR")} exibidos`
            : null}
        </p>
      ) : null}
      <ul className="flex flex-col gap-4">
        {items.map((animal) => (
          <li
            key={animal.id}
            className="flex min-w-0 flex-col gap-2 border-b border-border-light pb-4"
          >
            <h2 className="text-lg font-bold break-words">{animal.name}</h2>
            <p>
              <Badge tone={animal.status === "archived" ? "outline" : "info"}>
                {LIFECYCLE_STATUS_LABELS[animal.status] ??
                  "Situação não informada"}
              </Badge>
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
                {animal.status === "archived"
                  ? "Ver histórico"
                  : "Editar animal"}
              </LinkButton>
              {organizationId ? (
                <LinkButton
                  variant="outline"
                  href={`/ngo/pets/${animal.id}/interested`}
                >
                  Interessados e pedidos
                </LinkButton>
              ) : null}
              {userId && canReassignOrganization(animal, userId) ? (
                <Button
                  variant="outline"
                  onClick={() => setReassigning(animal)}
                >
                  Trocar ONG
                </Button>
              ) : null}
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
      {reassigning ? (
        <ReassignOrganizationSheet
          animal={reassigning}
          onClose={() => setReassigning(null)}
        />
      ) : null}
    </>
  );
}
