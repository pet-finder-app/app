"use client";
import { Button, EmptyState, LoadingState } from "@/components/ui";
import { conversationUnreadOptions } from "@/lib/api/community";
import { hasNextPage } from "@/lib/api/pagination";
import { conversationsOptions } from "@/lib/api/queries";
import { useQuery } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
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
  // Refresh unread counts together with the conversation list.
  const unread = useQuery({
    ...conversationUnreadOptions(),
    refetchInterval: 15_000,
  });
  const unreadById = new Map<string, number>(
    unread.data?.items.map(
      (item) => [item.conversationId, item.unreadCount] as const,
    ),
  );
  // Go's total decides whether more pages exist; never infer it from a full page.
  const hasNext = query.data ? hasNextPage(query.data.page) : false;
  return (
    <>
      <div className="flex flex-col gap-4 px-4 empty:hidden">
        <QueryStatus query={query} hasPendingText={false} />
      </div>
      {query.isPending ? <LoadingState /> : null}
      {query.data && !query.data.items.length ? (
        <EmptyState icon={MessagesSquare}>
          Você ainda não tem conversas.
        </EmptyState>
      ) : null}
      <ul className="flex flex-col">
        {query.data?.items.map((item) => {
          const unreadCount = unreadById.get(item.id) ?? 0;
          return (
            <li key={item.id} className="border-b border-border-light">
              <Link
                className="block px-4 py-3 hover:bg-primary-faint focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-tertiary"
                href={`${organizationId ? "/ngo/conversations" : "/adopter/conversations"}/${item.id}`}
              >
                <h2 className="flex items-center justify-between gap-2 font-bold">
                  <span className="min-w-0 truncate">{item.animalName}</span>
                  {unreadCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-red-700 px-2 py-0.5 text-xs text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                      <span className="sr-only">
                        {unreadCount === 1
                          ? " mensagem não lida"
                          : " mensagens não lidas"}
                      </span>
                    </span>
                  ) : null}
                </h2>
                <p>
                  {"counterpartyName" in item
                    ? item.counterpartyName
                    : item.organizationName}
                </p>
                <p className="truncate text-sm">{item.lastMessageBody}</p>
                <time className="text-xs">
                  {formatDate(item.lastMessageAt)}
                </time>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Shown while a later page exists, or to return from the last one. */}
      {hasNext || page > 1 ? (
        <div className="flex gap-3 px-4">
          <Button
            variant="outline"
            disabled={page === 1 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Voltar
          </Button>
          <Button
            variant="outline"
            disabled={!hasNext || query.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}
    </>
  );
}
