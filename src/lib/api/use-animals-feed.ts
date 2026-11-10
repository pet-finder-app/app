"use client";
import type { FeedPostItem as HomeFeedItem } from "@/components/posts/feed-post";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import {
  animalOptions,
  animalsOptions,
  locationOptions,
  preferencesOptions,
} from "@/lib/api/queries";
import type {
  ListAvailableAnimalsRow,
  ListPreferredAnimalsRow,
} from "@/lib/backend/contracts";
import type { QueryClient } from "@tanstack/react-query";
import {
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
export function useAnimalsFeed(mode: AnimalsFeedMode = "discover") {
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
          if (result.items.length < 100) break;
        }
      }
      const hiddenItems =
        mode === "discover"
          ? await Promise.all(
              hiddenAnimals.map((animal) => hydrateAnimal(client, animal)),
            )
          : [];
      return { liked, hidden, hiddenItems };
    },
  });
  const query = useInfiniteQuery({
    queryKey: queryKeys.feed(
      mode,
      coordinates ? `${coordinates.lat},${coordinates.lon}` : "none",
    ),
    initialPageParam: 1,
    queryFn: async ({
      pageParam,
    }): Promise<{ items: HomeFeedItem[]; hasMore: boolean }> => {
      const result =
        mode === "discover"
          ? await client.fetchQuery(
              animalsOptions(pageParam, coordinates ?? undefined),
            )
          : await client.fetchQuery(preferencesOptions(mode, pageParam));
      const items = await Promise.all(
        result.items.map(async (animal): Promise<HomeFeedItem> => {
          return hydrateAnimal(client, animal);
        }),
      );
      return {
        items,
        hasMore: result.items.length === (mode === "discover" ? 20 : 100),
      };
    },
    getNextPageParam: (last, _pages, page) =>
      last.hasMore ? page + 1 : undefined,
  });
  const items = useMemo(
    () =>
      Array.from(
        new Map(
          [
            ...(query.data?.pages.flatMap((page) => page.items) ?? []),
            ...(preferences.data?.hiddenItems ?? []),
          ].map((item) => [item.id, item]),
        ).values(),
      ).map((item) => ({
        ...item,
        liked: preferences.data?.liked.has(item.id) ?? item.liked,
        isHidden: preferences.data?.hidden.has(item.id) ?? item.isHidden,
      })),
    [query.data, preferences.data],
  );
  return { items, query, preferences, location, coordinates };
}
