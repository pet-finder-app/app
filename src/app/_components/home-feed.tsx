"use client";

import {
  FeedPost,
  type FeedPostItem as HomeFeedItem,
} from "@/components/posts/feed-post";
import { Button } from "@/components/ui";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  readFeedSnapshot,
  writeFeedSnapshot,
  type FeedNavigationSnapshot,
} from "./feed-navigation";
import type { FeedFilterState } from "./feed-query";
import { HomeFeedFilters, type FeedDisplayMode } from "./home-feed-filters";

export type { FeedPostItem as HomeFeedItem } from "@/components/posts/feed-post";

type HomeFeedProps = {
  items: HomeFeedItem[];
  isLocationActive: boolean;
  isLocationEnabled: boolean;
  initialFilters?: FeedFilterState;
  initialPostId?: string | null;
  notices?: ReactNode;
};
const PAGE_SIZE = 10;

/** Append another batch near the end without pagination or repeated records. */
export function HomeFeed({
  items,
  isLocationActive,
  isLocationEnabled,
  initialFilters = {
    displayMode: "scroll",
    showHidden: false,
    locationEnabled: isLocationEnabled,
  },
  initialPostId = null,
  notices,
}: HomeFeedProps) {
  const initialIndex =
    initialFilters.displayMode === "grid" && initialPostId
      ? items
          .filter((item) => initialFilters.showHidden || !item.isHidden)
          .findIndex((item) => item.id === initialPostId)
      : -1;
  const initialSnapshot: FeedNavigationSnapshot | null =
    initialIndex >= 0
      ? {
          mode: "scroll",
          isGridPreview: true,
          itemId: initialPostId,
          scrollY: 0,
          visibleCount: Math.max(
            PAGE_SIZE * 3,
            Math.ceil((initialIndex + 1) / PAGE_SIZE) * PAGE_SIZE,
          ),
          showHidden: initialFilters.showHidden,
        }
      : null;
  const [visibleCount, setVisibleCount] = useState(
    initialSnapshot?.visibleCount ?? PAGE_SIZE,
  );
  const [displayMode, setDisplayMode] = useState<FeedDisplayMode>(
    initialSnapshot?.mode ?? initialFilters.displayMode,
  );
  const [showHidden, setShowHidden] = useState(initialFilters.showHidden);
  const [hiddenOverrides, setHiddenOverrides] = useState<
    Record<string, boolean>
  >({});
  const [isGridPreview, setIsGridPreview] = useState(
    initialSnapshot?.isGridPreview ?? false,
  );
  const [locationEnabled, setLocationEnabled] = useState(
    initialFilters.locationEnabled,
  );
  const [navigationRevision, setNavigationRevision] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const pendingRestoreRef = useRef<FeedNavigationSnapshot | null>(
    initialSnapshot,
  );
  const activeSnapshotRef = useRef<FeedNavigationSnapshot | null>(
    initialSnapshot,
  );
  const filterPreferencesRef = useRef<FeedFilterState>({ ...initialFilters });
  const isInitialNavigationRef = useRef(true);
  const router = useRouter();
  function isItemHidden(item: HomeFeedItem) {
    return item.pet ? (hiddenOverrides[item.pet.id] ?? item.isHidden) : false;
  }
  const visibleItems = items.filter(
    (item) =>
      (showHidden || !isItemHidden(item)) &&
      (displayMode === "scroll" || item.pet !== null),
  );
  const batchSize = displayMode === "grid" ? PAGE_SIZE * 3 : PAGE_SIZE;
  const displayedCount = Math.max(visibleCount, batchSize);
  const hasMore = displayedCount < visibleItems.length;

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    function restore(snapshot: FeedNavigationSnapshot) {
      const preferences = {
        ...filterPreferencesRef.current,
        displayMode: snapshot.isGridPreview ? ("grid" as const) : snapshot.mode,
      };
      filterPreferencesRef.current = preferences;
      const restored = { ...snapshot, showHidden: preferences.showHidden };
      activeSnapshotRef.current = restored;
      pendingRestoreRef.current = restored;
      setDisplayMode(snapshot.mode);
      setIsGridPreview(snapshot.isGridPreview);
      setVisibleCount(snapshot.visibleCount);
      // History can restore the same view and batch at a different scroll position.
      setNavigationRevision((revision) => revision + 1);
      // Back changes the view and position, keeping the user's latest filter choices.
      writeFeedSnapshot("replace", restored, preferences);
    }
    function handlePopState(event: PopStateEvent) {
      const state: unknown = event.state;
      const snapshot = readFeedSnapshot(state);
      if (snapshot) restore(snapshot);
      else activeSnapshotRef.current = null;
    }
    const state: unknown = window.history.state;
    const snapshot = readFeedSnapshot(state);
    const frame = snapshot
      ? window.requestAnimationFrame(() => restore(snapshot))
      : null;
    window.addEventListener("popstate", handlePopState);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("popstate", handlePopState);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    // Next.js refreshes can replace history state after likes or GPS updates.
    // Reattach only our metadata, retaining the router's latest internal fields.
    const snapshot = activeSnapshotRef.current;
    if (window.location.pathname !== "/") return;
    const state: unknown = window.history.state;
    if (
      snapshot &&
      !readFeedSnapshot(state) &&
      isInitialNavigationRef.current &&
      snapshot.isGridPreview
    ) {
      // A shared post URL needs a grid history entry for the back control, too.
      writeFeedSnapshot(
        "replace",
        { ...snapshot, mode: "grid", isGridPreview: false },
        filterPreferencesRef.current,
      );
      writeFeedSnapshot("push", snapshot, filterPreferencesRef.current);
    } else if (snapshot && !readFeedSnapshot(state)) {
      writeFeedSnapshot("replace", snapshot, filterPreferencesRef.current);
    }
    isInitialNavigationRef.current = false;
  });

  useLayoutEffect(() => {
    const snapshot = pendingRestoreRef.current;
    if (!snapshot || displayMode !== snapshot.mode) return;
    const item = Array.from(listRef.current?.children ?? []).find(
      (element) =>
        element instanceof HTMLElement &&
        element.dataset.feedItem === snapshot.itemId,
    );
    if (
      snapshot.mode === "scroll" &&
      snapshot.itemId &&
      item instanceof HTMLElement
    ) {
      const top =
        item.getBoundingClientRect().top +
        window.scrollY -
        (filtersRef.current?.getBoundingClientRect().bottom ?? 96);
      window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
      item
        .querySelector<HTMLElement>("article")
        ?.focus({ preventScroll: true });
    } else {
      window.scrollTo({ top: snapshot.scrollY, behavior: "instant" });
      item
        ?.querySelector<HTMLElement>("button")
        ?.focus({ preventScroll: true });
    }
    pendingRestoreRef.current = null;
  }, [
    displayMode,
    displayedCount,
    isGridPreview,
    showHidden,
    navigationRevision,
  ]);

  function handleOpenFromGrid(itemId: string) {
    const scrollItems = items.filter(
      (item) => showHidden || !isItemHidden(item),
    );
    const index = scrollItems.findIndex((item) => item.id === itemId);
    if (index === -1) return;
    const gridSnapshot: FeedNavigationSnapshot = {
      mode: "grid",
      isGridPreview: false,
      itemId,
      scrollY: window.scrollY,
      visibleCount: displayedCount,
      showHidden,
    };
    writeFeedSnapshot("replace", gridSnapshot, filterPreferencesRef.current);
    const preview: FeedNavigationSnapshot = {
      ...gridSnapshot,
      mode: "scroll",
      isGridPreview: true,
      scrollY: 0,
      visibleCount: Math.max(
        displayedCount,
        Math.ceil((index + 1) / PAGE_SIZE) * PAGE_SIZE,
      ),
    };
    writeFeedSnapshot("push", preview, filterPreferencesRef.current);
    pendingRestoreRef.current = preview;
    activeSnapshotRef.current = preview;
    setVisibleCount(preview.visibleCount);
    setIsGridPreview(true);
    setDisplayMode("scroll");
  }

  function handleDisplayModeChange(mode: FeedDisplayMode) {
    if (mode === displayMode) return;
    if (isGridPreview && mode === "grid") {
      window.history.back();
      return;
    }
    const snapshot: FeedNavigationSnapshot = {
      mode,
      isGridPreview: false,
      itemId: null,
      scrollY: 0,
      visibleCount: displayedCount,
      showHidden,
    };
    filterPreferencesRef.current = {
      ...filterPreferencesRef.current,
      displayMode: mode,
    };
    writeFeedSnapshot("replace", snapshot, filterPreferencesRef.current);
    pendingRestoreRef.current = snapshot;
    activeSnapshotRef.current = snapshot;
    setIsGridPreview(false);
    setDisplayMode(mode);
  }

  function saveFilterPreferences(preferences: FeedFilterState) {
    filterPreferencesRef.current = preferences;
    const active = activeSnapshotRef.current;
    const snapshot: FeedNavigationSnapshot = {
      mode: active?.mode ?? displayMode,
      isGridPreview: active?.isGridPreview ?? isGridPreview,
      itemId: active?.itemId ?? null,
      scrollY: window.scrollY,
      visibleCount: Math.max(displayedCount, active?.visibleCount ?? 0),
      showHidden: preferences.showHidden,
    };
    activeSnapshotRef.current = snapshot;
    writeFeedSnapshot("replace", snapshot, preferences);
  }

  function handleShowHiddenChange(show: boolean) {
    setShowHidden(show);
    saveFilterPreferences({
      ...filterPreferencesRef.current,
      showHidden: show,
    });
  }

  function handleLocationEnabledChange(enabled: boolean) {
    if (filterPreferencesRef.current.locationEnabled === enabled) return;
    setLocationEnabled(enabled);
    saveFilterPreferences({
      ...filterPreferencesRef.current,
      locationEnabled: enabled,
    });
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasMore || !sentinel || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting)
          setVisibleCount((count) => Math.max(count, batchSize) + batchSize);
      },
      { rootMargin: "600px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visibleCount, batchSize]);

  function handleHiddenChange(petId: string, isHidden: boolean) {
    setHiddenOverrides((overrides) => ({ ...overrides, [petId]: isHidden }));
    router.refresh();
  }

  return (
    <>
      <HomeFeedFilters
        ref={filtersRef}
        displayMode={displayMode}
        onDisplayModeChange={handleDisplayModeChange}
        onReturnToGrid={isGridPreview ? () => window.history.back() : undefined}
        showHidden={showHidden}
        onShowHiddenChange={handleShowHiddenChange}
        isLocationActive={isLocationActive}
        isLocationEnabled={locationEnabled}
        onLocationEnabledChange={handleLocationEnabledChange}
      />
      {notices}
      <ul
        ref={listRef}
        className={
          displayMode === "grid"
            ? "grid grid-cols-3 gap-0.5"
            : "flex flex-col divide-y divide-border-light"
        }
      >
        {visibleItems
          .slice(0, displayedCount)
          .map((item) =>
            displayMode === "grid" ? (
              <HomeFeedGridItem
                key={item.id}
                item={item}
                onOpen={handleOpenFromGrid}
              />
            ) : (
              <FeedPost
                key={item.id}
                item={item}
                isHidden={isItemHidden(item)}
                onHiddenChange={handleHiddenChange}
              />
            ),
          )}
      </ul>
      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center p-6">
          <Button
            variant="outline"
            onClick={() =>
              setVisibleCount((count) => Math.max(count, batchSize) + batchSize)
            }
          >
            Ver mais publicações
          </Button>
        </div>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-neutral-600">
          {visibleItems.length
            ? "Você viu todas as publicações por enquanto."
            : "Nenhuma publicação para mostrar no momento."}
        </p>
      )}
    </>
  );
}

type HomeFeedGridItemProps = {
  item: HomeFeedItem;
  onOpen: (itemId: string) => void;
};

function HomeFeedGridItem({ item, onOpen }: HomeFeedGridItemProps) {
  if (!item.pet) return null;
  const photo =
    item.post?.media.find((media) => media.type === "image")?.url ??
    item.pet.photos.find((photo) => photo.url)?.url;
  return (
    <li data-feed-item={item.id} className="min-w-0">
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-label={`Abrir publicação de ${item.pet.name}`}
        className="relative block aspect-square w-full overflow-hidden bg-secondary focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-text"
      >
        {photo ? (
          <Image
            src={photo}
            alt={item.pet.name}
            fill
            sizes="(max-width: 512px) 33vw, 170px"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-text">
            Foto indisponível
          </span>
        )}
      </button>
    </li>
  );
}
