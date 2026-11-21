"use client";

import { QueryStatus } from "@/components/backend/query-status";
import { Button } from "@/components/ui";
import { followingOptions } from "@/lib/api/community";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FollowButton } from "./follow-button";

/** Organizations the signed-in person follows ("ONGs que sigo"). */
export function FollowingList() {
  const query = useInfiniteQuery(followingOptions());
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.page.total ?? 0;
  return (
    <section aria-label="ONGs que sigo" className="flex flex-col gap-3">
      <QueryStatus query={query} />
      {query.data && items.length === 0 ? (
        <p>Você ainda não segue nenhuma ONG.</p>
      ) : null}
      {total > 0 ? (
        <p className="text-sm text-neutral-600">
          {total === 1 ? "Você segue 1 ONG" : `Você segue ${total} ONGs`}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((organization) => (
          <li
            key={organization.id}
            className="flex flex-col gap-2 border-b border-border-light pb-3"
          >
            <Link
              href={`/organizations/${encodeURIComponent(organization.id)}`}
              className="font-bold focus-visible:outline-2 focus-visible:outline-accent-tertiary"
            >
              {organization.name}
            </Link>
            {organization.location?.city ? (
              <p className="text-sm text-neutral-600">
                {[organization.location.city, organization.location.state]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            <FollowButton organizationId={organization.id} />
          </li>
        ))}
      </ul>
      {query.hasNextPage ? (
        <Button
          variant="outline"
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Carregar mais ONGs
        </Button>
      ) : null}
    </section>
  );
}
