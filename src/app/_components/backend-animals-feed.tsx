"use client";
import { QueryStatus } from "@/components/backend/query-status";
import { Button } from "@/components/ui";
import { useAnimalsFeed } from "@/lib/api/use-animals-feed";
import type { FeedFilterState } from "./feed-query";
import { HomeFeed } from "./home-feed";

type AnimalsFeedProps = {
  initialFilters?: FeedFilterState;
  initialPostId?: string | null;
};
export function AnimalsFeed({
  initialFilters,
  initialPostId,
}: AnimalsFeedProps) {
  const { items, query, preferences, location, coordinates } = useAnimalsFeed();
  return (
    <>
      <QueryStatus query={query} />
      <QueryStatus query={preferences} />
      {query.data ? (
        <HomeFeed
          items={items}
          isLocationActive={Boolean(coordinates)}
          isLocationEnabled={
            location.data?.enabled ?? initialFilters?.locationEnabled ?? true
          }
          initialFilters={initialFilters}
          initialPostId={initialPostId}
        />
      ) : null}
      {query.hasNextPage ? (
        <Button
          variant="outline"
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Carregar mais animais
        </Button>
      ) : null}
    </>
  );
}
