"use client";

import { formatDate } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { Button, FormError, cn } from "@/components/ui";
import { communityMutations, notificationsOptions } from "@/lib/api/community";
import type { NotificationResponse } from "@/lib/backend/contracts";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { notificationHref, notificationLabel } from "./notification-labels";

/**
 * The signed-in person's Go notifications with read actions. Each item links
 * to the adopter or NGO page for its side of the case (Go's `audience`).
 */
export function NotificationList() {
  const router = useRouter();
  const query = useInfiniteQuery(notificationsOptions());
  const read = useMutation(communityMutations.readNotifications());
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const hasUnread = items.some((item) => item.readAt === null);

  function handleOpen(item: NotificationResponse) {
    const href = notificationHref(item);
    if (item.readAt === null)
      read.mutate(item.id, {
        onSuccess: () => {
          if (href) router.push(href);
        },
      });
    else if (href) router.push(href);
  }

  return (
    <section aria-label="Notificações" className="flex flex-col gap-3">
      <QueryStatus query={query} />
      {hasUnread ? (
        <Button
          variant="outline"
          loading={read.isPending && read.variables === undefined}
          disabled={read.isPending}
          onClick={() => read.mutate(undefined)}
        >
          Marcar todas como lidas
        </Button>
      ) : null}
      <FormError id="notification-error" collapsible>
        {read.error?.message}
      </FormError>
      {query.data && items.length === 0 ? (
        <p>Você não tem notificações.</p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const isUnread = item.readAt === null;
          const href = notificationHref(item);
          const label = notificationLabel(item.kind);
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={read.isPending || (!href && !isUnread)}
                onClick={() => handleOpen(item)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border border-border-light px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-accent-tertiary disabled:cursor-default",
                  isUnread ? "bg-secondary" : "bg-white",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    isUnread ? "bg-accent-tertiary" : "bg-transparent",
                  )}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className={cn(isUnread && "font-bold")}>
                    {label}
                    {isUnread ? (
                      <span className="sr-only"> (não lida)</span>
                    ) : null}
                  </span>
                  <time
                    dateTime={item.createdAt}
                    className="text-xs text-neutral-600"
                  >
                    {formatDate(item.createdAt)}
                  </time>
                  {!href && isUnread ? (
                    <span className="text-xs text-neutral-600">
                      Toque para marcar como lida.
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {query.hasNextPage ? (
        <Button
          variant="outline"
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Carregar mais notificações
        </Button>
      ) : null}
    </section>
  );
}
