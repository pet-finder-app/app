"use client";
import { QueryStatus } from "@/components/backend/query-status";
import { Button, FormError } from "@/components/ui";
import { animalMutations, animalQueries } from "@/lib/api/animals";
import { hasNextPage, pageCount } from "@/lib/api/pagination";
import { animalOptions } from "@/lib/api/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

const numberFormat = new Intl.NumberFormat("pt-BR");

type AnimalInterestPanelProps = { animalId: string };

/**
 * Likes, applications and people who liked the animal and allow ONG contact.
 * Go restricts it to members who manage applications (and admins).
 */
export function AnimalInterestPanel({ animalId }: AnimalInterestPanelProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const interest = useQuery(animalQueries.interest(animalId, page));
  const animal = useQuery(animalOptions(animalId));
  const start = useMutation(animalMutations.startConversation());
  const isAvailable = animal.data?.animal.status === "available";
  const people = interest.data?.people ?? [];
  const pageMeta = interest.data?.page;
  const totalPages = pageMeta ? pageCount(pageMeta) : 1;
  const hasNext = pageMeta ? hasNextPage(pageMeta) : false;
  return (
    <section
      aria-labelledby="animal-interest-title"
      className="flex flex-col gap-4"
    >
      <h2 id="animal-interest-title" className="text-lg font-bold">
        Interesse {animal.data ? `em ${animal.data.animal.name}` : null}
      </h2>
      <QueryStatus query={interest} />
      {interest.data ? (
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border-light p-3">
            <dt className="text-sm text-neutral-600">Curtidas</dt>
            <dd className="text-2xl font-bold">
              {numberFormat.format(interest.data.likeCount)}
            </dd>
          </div>
          <div className="rounded-2xl border border-border-light p-3">
            <dt className="text-sm text-neutral-600">Pedidos de adoção</dt>
            <dd className="text-2xl font-bold">
              {numberFormat.format(interest.data.applicants)}
            </dd>
          </div>
        </dl>
      ) : null}
      <h3 className="font-bold">Pessoas que aceitam contato da ONG</h3>
      {pageMeta && pageMeta.total > 0 ? (
        <p className="text-sm text-neutral-600">
          {pageMeta.total === 1
            ? "1 pessoa interessada"
            : `${numberFormat.format(pageMeta.total)} pessoas interessadas`}
        </p>
      ) : null}
      {animal.data && !isAvailable ? (
        <p role="note">
          Só é possível iniciar conversas enquanto o animal está disponível.
        </p>
      ) : null}
      {interest.data && !people.length ? (
        <p>
          {page === 1
            ? "Nenhuma pessoa que curtiu este animal permitiu contato da ONG."
            : "Nenhuma pessoa nesta página."}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {people.map((person) => (
          <li
            key={person.userId}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light pb-3"
          >
            <span className="min-w-0 font-medium break-words">
              {person.name}
            </span>
            <Button
              variant="outline"
              loading={
                start.isPending && start.variables?.userId === person.userId
              }
              disabled={!isAvailable || start.isPending}
              aria-label={`Iniciar conversa com ${person.name}`}
              onClick={() =>
                start.mutate(
                  { id: animalId, userId: person.userId },
                  {
                    onSuccess: (conversation) =>
                      router.push(`/ngo/conversations/${conversation.id}`),
                  },
                )
              }
            >
              Iniciar conversa
            </Button>
          </li>
        ))}
      </ul>
      <FormError id="interest-conversation-error">
        {start.error?.message}
      </FormError>
      {page > 1 || hasNext ? (
        <nav
          aria-label="Páginas de interessados"
          className="flex flex-wrap items-center gap-2"
        >
          <Button
            variant="outline"
            disabled={page === 1 || interest.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Página anterior
          </Button>
          <span className="text-sm text-neutral-600" aria-live="polite">
            Página {page} de {Math.max(page, totalPages)}
          </span>
          <Button
            variant="outline"
            disabled={!hasNext || interest.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Próxima página
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
