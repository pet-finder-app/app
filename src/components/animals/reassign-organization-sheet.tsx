"use client";
import { QueryStatus } from "@/components/backend/query-status";
import { Button, Select } from "@/components/ui";
import { animalMutations } from "@/lib/api/animals";
import { queryKeys } from "@/lib/api/keys";
import { nextPageParam } from "@/lib/api/pagination";
import { organizationsOptions } from "@/lib/api/queries";
import type { Animal } from "@/lib/backend/contracts";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { ReasonSheet } from "./reason-sheet";

type ReassignOrganizationSheetProps = {
  animal: Animal;
  onClose: () => void;
};

/** Go accepts this only for pending private submissions and verified ONGs. */
export function canReassignOrganization(animal: Animal, userId: string) {
  return (
    animal.submittedBy === userId &&
    animal.source === "private_submission" &&
    animal.status === "pending_organization" &&
    ["pending", "changes_requested"].includes(animal.organizationReviewStatus)
  );
}

export function ReassignOrganizationSheet({
  animal,
  onClose,
}: ReassignOrganizationSheetProps) {
  const client = useQueryClient();
  // Go lists only verified ONGs here; page past the first 100 on demand.
  const organizations = useInfiniteQuery({
    queryKey: [...queryKeys.organizations, "list", "pages"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      client.fetchQuery(organizationsOptions(pageParam)),
    getNextPageParam: nextPageParam,
  });
  const assign = useMutation(animalMutations.assignOrganization());
  const [organizationId, setOrganizationId] = useState("");
  const items = organizations.data?.pages.flatMap((page) => page.items) ?? [];
  const total = organizations.data?.pages.at(-1)?.page.total ?? 0;
  const options = items
    .filter((item) => item.id !== animal.responsibleOrganizationId)
    .map((item) => ({ value: item.id, label: item.name }));
  const current = items.find(
    (item) => item.id === animal.responsibleOrganizationId,
  );
  return (
    <ReasonSheet
      id="animal-reassign"
      title={`Trocar a ONG de ${animal.name}`}
      confirmLabel="Encaminhar para a ONG"
      reasonLabel="Motivo da troca"
      isBusy={assign.isPending}
      error={assign.error?.message}
      isConfirmDisabled={!organizationId}
      onConfirm={(reason) =>
        assign.mutate(
          { id: animal.id, organizationId, reason },
          { onSuccess: onClose },
        )
      }
      onClose={onClose}
    >
      <p className="text-sm leading-relaxed text-neutral-600">
        {current ? `Hoje o encaminhamento está com ${current.name}. ` : null}
        Só é possível trocar enquanto a ONG ainda não aceitou o animal e não há
        pedidos ou conversas sobre ele. Apenas ONGs verificadas aparecem na
        lista.
      </p>
      <QueryStatus query={organizations} />
      <Select
        id="animal-reassign-organization"
        label="Nova ONG responsável"
        required
        placeholder="Escolha uma ONG verificada"
        value={organizationId}
        options={options}
        onChange={(event) => setOrganizationId(event.target.value)}
      />
      {organizations.hasNextPage ? (
        <Button
          variant="outline"
          loading={organizations.isFetchingNextPage}
          onClick={() => void organizations.fetchNextPage()}
        >
          Carregar mais ONGs ({items.length.toLocaleString("pt-BR")} de{" "}
          {total.toLocaleString("pt-BR")})
        </Button>
      ) : null}
    </ReasonSheet>
  );
}
