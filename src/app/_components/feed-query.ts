import type { FeedDisplayMode } from "./home-feed-filters";

export type FeedFilterState = {
  displayMode: FeedDisplayMode;
  showHidden: boolean;
  locationEnabled: boolean;
};

export type FeedSearchParams = {
  view?: string | string[];
  hidden?: string | string[];
  location?: string | string[];
  post?: string | string[];
};

/** Client-safe parsing shared by server rendering and browser navigation. */
export function readFeedQuery(
  params: FeedSearchParams,
  defaultLocationEnabled: boolean,
): FeedFilterState {
  return {
    displayMode: params.view === "grid" ? "grid" : "scroll",
    showHidden: params.hidden === "true",
    locationEnabled:
      params.location === "true"
        ? true
        : params.location === "false"
          ? false
          : defaultLocationEnabled,
  };
}

export function createFeedUrl(
  href: string,
  filters: FeedFilterState,
  postId: string | null,
): string {
  const url = new URL(href);
  url.searchParams.set("view", filters.displayMode);
  url.searchParams.set("hidden", String(filters.showHidden));
  url.searchParams.set("location", String(filters.locationEnabled));
  if (postId) url.searchParams.set("post", postId);
  else url.searchParams.delete("post");
  return `${url.pathname}${url.search}${url.hash}`;
}
