"use client";
import { QueryStatus } from "@/components/backend/query-status";
import { Button } from "@/components/ui";
import type { AnimalSpecies } from "@/lib/api/animals";
import { useAnimalsFeed } from "@/lib/api/use-animals-feed";
import { useState } from "react";
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
  const [species, setSpecies] = useState<AnimalSpecies | null>(
    initialFilters?.species ?? null,
  );
  const { items, query, preferences, location, coordinates } = useAnimalsFeed(
    "discover",
    species,
  );
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
          species={species}
          onSpeciesChange={setSpecies}
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
