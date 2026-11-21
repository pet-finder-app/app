"use client";
import { formatDate } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { Button } from "@/components/ui";
import { animalMutations, animalQueries } from "@/lib/api/animals";
import { membersOptions } from "@/lib/api/queries";
import type { Animal, UserResponse } from "@/lib/backend/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HISTORY_ACTION_LABELS,
  LIFECYCLE_STATUS_LABELS,
} from "./animal-labels";
import { ReasonSheet } from "./reason-sheet";

type AnimalLifecyclePanelProps = {
  animal: Animal;
  user: UserResponse;
  selectedOrganizationId?: string;
};

/**
 * Archive/delete actions and the lifecycle history. Go allows them to the
 * submitter of an unaccepted private submission, publishing members and admins.
 */
export function AnimalLifecyclePanel({
  animal,
  user,
  selectedOrganizationId,
}: AnimalLifecyclePanelProps) {
  const router = useRouter();
  const isAdmin = user.roles.includes("admin");
  const organizationId = animal.responsibleOrganizationId;
  const isSubmitter = animal.submittedBy === user.id;
  const submitterControls =
    isSubmitter &&
    animal.source === "private_submission" &&
    animal.organizationReviewStatus !== "accepted";
  const shouldCheckMembership = Boolean(
    organizationId && organizationId === selectedOrganizationId,
  );
  const members = useQuery({
    ...membersOptions(organizationId ?? ""),
    enabled: shouldCheckMembership,
  });
  const membership = members.data?.items.find(
    (member) => member.userId === user.id && member.status === "active",
  );
  const canViewHistory = isAdmin || isSubmitter || Boolean(membership);
  const canRetain =
    isAdmin || submitterControls || Boolean(membership?.canPublishAnimals);
  const history = useQuery({
    ...animalQueries.history(animal.id),
    enabled: canViewHistory,
  });
  const archive = useMutation(animalMutations.archive());
  const remove = useMutation(animalMutations.remove());
  const [action, setAction] = useState<"archive" | "delete" | null>(null);
  const isArchived = animal.status === "archived";
  function handleClose() {
    setAction(null);
    archive.reset();
    remove.reset();
  }
  function handleConfirm(reason: string) {
    if (action === "archive")
      archive.mutate(
        { id: animal.id, reason },
        { onSuccess: () => setAction(null) },
      );
    else if (action === "delete")
      remove.mutate(
        { id: animal.id, reason },
        {
          onSuccess: () => {
            router.push(membership ? "/ngo/pets" : "/adopter/animals");
            router.refresh();
          },
        },
      );
  }
  if (!canViewHistory && !canRetain) return null;
  return (
    <section
      aria-labelledby="animal-lifecycle-title"
      className="flex flex-col gap-3 border-t border-border-light pt-4"
    >
      <h2 id="animal-lifecycle-title" className="text-lg font-bold">
        Situação e histórico
      </h2>
      {shouldCheckMembership ? <QueryStatus query={members} /> : null}
      <p>
        Situação atual:{" "}
        {LIFECYCLE_STATUS_LABELS[animal.status] ?? "Situação não informada"}
      </p>
      {isArchived ? (
        <p role="note">
          Este animal está arquivado e não aparece na busca pública.
        </p>
      ) : null}
      {canRetain ? (
        <div className="flex flex-wrap gap-2">
          {isArchived ? null : (
            <Button variant="outline" onClick={() => setAction("archive")}>
              Arquivar animal
            </Button>
          )}
          <Button variant="danger-ghost" onClick={() => setAction("delete")}>
            Excluir animal
          </Button>
        </div>
      ) : null}
      {archive.isSuccess ? <p role="status">Animal arquivado.</p> : null}
      {canViewHistory ? (
        <>
          <h3 className="font-bold">Histórico</h3>
          <QueryStatus query={history} />
          {history.data && !history.data.items.length ? (
            <p>Nenhum registro de arquivamento ou troca de ONG.</p>
          ) : null}
          <ol className="flex flex-col gap-3">
            {history.data?.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 border-b border-border-light pb-3"
              >
                <p className="font-medium">
                  {HISTORY_ACTION_LABELS[item.action] ?? "Alteração"}
                  {item.fromStatus !== item.toStatus
                    ? ` · ${LIFECYCLE_STATUS_LABELS[item.fromStatus] ?? item.fromStatus} → ${LIFECYCLE_STATUS_LABELS[item.toStatus] ?? item.toStatus}`
                    : null}
                </p>
                <p className="text-sm text-neutral-600">
                  {formatDate(item.createdAt)}
                </p>
                <p className="break-words whitespace-pre-line">
                  Motivo: {item.reason}
                </p>
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {action ? (
        <ReasonSheet
          id={`animal-${action}`}
          title={
            action === "archive"
              ? `Arquivar ${animal.name}?`
              : `Excluir ${animal.name}?`
          }
          confirmLabel={
            action === "archive" ? "Arquivar animal" : "Excluir animal"
          }
          reasonLabel={
            action === "archive"
              ? "Motivo do arquivamento"
              : "Motivo da exclusão"
          }
          isDanger={action === "delete"}
          isBusy={archive.isPending || remove.isPending}
          error={archive.error?.message ?? remove.error?.message}
          onConfirm={handleConfirm}
          onClose={handleClose}
        >
          <p className="text-sm leading-relaxed text-neutral-600">
            {action === "archive"
              ? "O animal sai da busca pública e continua visível no inventário como arquivado. Não é possível arquivar com pedidos de adoção ativos."
              : "O animal deixa de aparecer em todos os inventários e na busca. O registro é mantido pelo Petfinder para fins de histórico. Não é possível excluir com pedidos de adoção ativos."}
          </p>
        </ReasonSheet>
      ) : null}
    </section>
  );
}
