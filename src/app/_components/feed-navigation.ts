import { createFeedUrl, type FeedFilterState } from "./feed-query";
import type { FeedDisplayMode } from "./home-feed-filters";

export type FeedNavigationSnapshot = {
  mode: FeedDisplayMode;
  isGridPreview: boolean;
  itemId: string | null;
  scrollY: number;
  visibleCount: number;
  showHidden: boolean;
};

/** Browser history also contains Next.js state; preserve its fields unchanged. */
export function withFeedSnapshot(
  state: unknown,
  snapshot: FeedNavigationSnapshot,
) {
  const current = typeof state === "object" && state !== null ? state : {};
  return { ...current, petfinderFeed: snapshot };
}

/** Use Next's native History integration when URL filters change, without a route fetch. */
export function writeFeedSnapshot(
  method: "push" | "replace",
  snapshot: FeedNavigationSnapshot,
  filters: FeedFilterState,
): void {
  const state: unknown = window.history.state;
  const data: Record<string, unknown> = withFeedSnapshot(state, snapshot);
  const url = createFeedUrl(
    window.location.href,
    filters,
    snapshot.isGridPreview ? snapshot.itemId : null,
  );
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (url !== currentUrl && data.__NA === true) {
    // Next reinserts its router markers and updates its canonical URL for external writes.
    // Keeping the markers in this argument would bypass that URL synchronization.
    delete data.__NA;
    delete data._N;
  }
  if (method === "push") window.history.pushState(data, "", url);
  else window.history.replaceState(data, "", url);
}

export function readFeedSnapshot(
  state: unknown,
): FeedNavigationSnapshot | null {
  if (
    typeof state !== "object" ||
    state === null ||
    !("petfinderFeed" in state)
  )
    return null;
  const value = state.petfinderFeed;
  if (
    typeof value !== "object" ||
    value === null ||
    !("mode" in value) ||
    (value.mode !== "grid" && value.mode !== "scroll") ||
    !("isGridPreview" in value) ||
    typeof value.isGridPreview !== "boolean" ||
    !("itemId" in value) ||
    (value.itemId !== null && typeof value.itemId !== "string") ||
    !("scrollY" in value) ||
    typeof value.scrollY !== "number" ||
    !Number.isFinite(value.scrollY) ||
    value.scrollY < 0 ||
    !("visibleCount" in value) ||
    typeof value.visibleCount !== "number" ||
    !Number.isInteger(value.visibleCount) ||
    value.visibleCount < 1 ||
    !("showHidden" in value) ||
    typeof value.showHidden !== "boolean" ||
    (value.isGridPreview && (value.mode !== "scroll" || !value.itemId))
  )
    return null;
  return {
    mode: value.mode,
    isGridPreview: value.isGridPreview,
    itemId: value.itemId,
    scrollY: value.scrollY,
    visibleCount: value.visibleCount,
    showHidden: value.showHidden,
  };
}
