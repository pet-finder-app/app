"use client";
import type { FeedPostItem as HomeFeedItem } from "@/components/posts/feed-post";
import { animalQueries, type AnimalSpecies } from "@/lib/api/animals";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import { hasNextPage } from "@/lib/api/pagination";
import {
  animalOptions,
  locationOptions,
  preferencesOptions,
} from "@/lib/api/queries";
import type {
  ListAvailableAnimalsRow,
  ListPreferredAnimalsRow,
} from "@/lib/backend/contracts";
import type { QueryClient } from "@tanstack/react-query";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

async function hydrateAnimal(
  client: QueryClient,
  animal: ListAvailableAnimalsRow | ListPreferredAnimalsRow,
): Promise<HomeFeedItem> {
  let photos: { url: string }[] = [];
  try {
    const detail = await client.fetchQuery(animalOptions(animal.id));
    photos = detail.images
      .filter(
        (image) =>
          image.moderationStatus === "approved" &&
          /^https?:\/\//.test(image.storageKey),
      )
      .map((image) => ({ url: image.storageKey }));
  } catch (error: unknown) {
    if (!(error instanceof ApiError && [403, 404].includes(error.status)))
      throw error;
  }
  return {
    id: animal.id,
    organizationId: animal.responsibleOrganizationId,
    post: null,
    pet: {
      id: animal.id,
      name: animal.name,
      description: animal.description,
      photos,
      status:
        animal.status === "adoption_in_progress"
          ? "in_progress"
          : animal.status === "adopted"
            ? "adopted"
            : animal.status === "available"
              ? "available"
              : "unavailable",
    },
    ngo: {
      name: animal.organizationName ?? "ONG responsável",
      nickname: animal.organizationSlug ?? "",
      logoUrl: null,
    },
    liked: false,
    isHidden: false,
  };
}

export type AnimalsFeedMode = "discover" | "liked" | "not_interested";
export type AnimalsFeedPage = {
  items: HomeFeedItem[];
  hasMore: boolean;
  /** Matching animals across all pages, from Go's `page.total`. */
  total: number;
};

/** One feed page: discovery honors location and species; preference lists ignore them. */
export async function fetchAnimalsFeedPage(
  client: QueryClient,
  {
    mode,
    page,
    coordinates = null,
    species = null,
  }: {
    mode: AnimalsFeedMode;
    page: number;
    coordinates?: { lat: number; lon: number } | null;
    species?: AnimalSpecies | null;
  },
): Promise<AnimalsFeedPage> {
  const result =
    mode === "discover"
      ? await client.fetchQuery(
          animalQueries.discover(page, coordinates ?? undefined, species),
        )
      : await client.fetchQuery(preferencesOptions(mode, page));
  const items = await Promise.all(
    result.items.map((animal) => hydrateAnimal(client, animal)),
  );
  return { items, hasMore: hasNextPage(result.page), total: result.page.total };
}

export function useAnimalsFeed(
  mode: AnimalsFeedMode = "discover",
  species: AnimalSpecies | null = null,
) {
  const client = useQueryClient();
  const location = useQuery(locationOptions);
  const coordinates = location.data?.enabled ? location.data.coordinates : null;
  const preferences = useQuery({
    queryKey: [...queryKeys.preferences, "feed", mode],
    queryFn: async () => {
      const liked = new Set<string>();
      const hidden = new Set<string>();
      const hiddenAnimals: ListPreferredAnimalsRow[] = [];
      for (const value of ["liked", "not_interested"] as const) {
        for (let page = 1; ; page++) {
          const result = await client.fetchQuery(
            preferencesOptions(value, page),
          );
          for (const animal of result.items)
            (value === "liked" ? liked : hidden).add(animal.id);
          if (value === "not_interested") hiddenAnimals.push(...result.items);
          if (!hasNextPage(result.page)) break;
        }
      }
      const hiddenItems =
        mode === "discover"
          ? await Promise.all(
              hiddenAnimals.map(
                async (animal) =>
                  [
                    animal.species,
                    await hydrateAnimal(client, animal),
                  ] as const,
              ),
            )
          : [];
      return { liked, hidden, hiddenItems };
    },
  });
  const query = useInfiniteQuery({
    queryKey: [
      ...queryKeys.feed(
        mode,
        coordinates ? `${coordinates.lat},${coordinates.lon}` : "none",
      ),
      mode === "discover" ? (species ?? "all") : "all",
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchAnimalsFeedPage(client, {
        mode,
        page: pageParam,
        coordinates,
        species: mode === "discover" ? species : null,
      }),
    getNextPageParam: (last, _pages, page) =>
      last.hasMore ? page + 1 : undefined,
    // Keep the feed (and its filters) mounted while another filter loads.
    placeholderData: keepPreviousData,
  });
  const items = useMemo(
    () =>
      Array.from(
        new Map(
          [
            ...(query.data?.pages.flatMap((page) => page.items) ?? []),
            // Hidden animals stay reachable through "Mostrar ocultos", within the species filter.
            ...(preferences.data?.hiddenItems ?? [])
              .filter(
                ([animalSpecies]) => !species || animalSpecies === species,
              )
              .map(([, item]) => item),
          ].map((item) => [item.id, item]),
        ).values(),
      ).map((item) => ({
        ...item,
        liked: preferences.data?.liked.has(item.id) ?? item.liked,
        isHidden: preferences.data?.hidden.has(item.id) ?? item.isHidden,
      })),
    [query.data, preferences.data, species],
  );
  const total = query.data?.pages.at(-1)?.total ?? 0;
  return { items, total, query, preferences, location, coordinates };
}
