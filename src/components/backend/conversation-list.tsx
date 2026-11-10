"use client";
import { Button } from "@/components/ui";
import { conversationsOptions } from "@/lib/api/queries";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { formatDate } from "./labels";
import { QueryStatus } from "./query-status";

export function ConversationList({
  organizationId,
}: {
  organizationId?: string;
}) {
  const [page, setPage] = useState(1);
  const query = useQuery(conversationsOptions(organizationId, page));
  return (
    <>
      <QueryStatus query={query} />
      {query.data && !query.data.items.length ? (
        <p>Você ainda não tem conversas.</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {query.data?.items.map((item) => (
          <li key={item.id} className="border-b border-border-light pb-3">
            <Link
              className="block focus-visible:outline-2 focus-visible:outline-accent-tertiary"
              href={`${organizationId ? "/ngo/conversations" : "/adopter/conversations"}/${item.id}`}
            >
              <h2 className="font-bold">{item.animalName}</h2>
              <p>
                {"counterpartyName" in item
                  ? item.counterpartyName
                  : item.organizationName}
              </p>
              <p className="truncate text-sm">{item.lastMessageBody}</p>
              <time className="text-xs">{formatDate(item.lastMessageAt)}</time>
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
