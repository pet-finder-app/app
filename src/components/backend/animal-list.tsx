"use client";
import { FeedPost } from "@/components/posts/feed-post";
import { Button, cn, EmptyState, LoadingState } from "@/components/ui";
import {
  useAnimalsFeed,
  type AnimalsFeedMode,
} from "@/lib/api/use-animals-feed";
import { EyeOff, Heart, PawPrint, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { QueryStatus } from "./query-status";

const EMPTY_ICONS: Record<AnimalsFeedMode, LucideIcon> = {
  discover: PawPrint,
  liked: Heart,
  not_interested: EyeOff,
};

type AnimalListProps = {
  mode?: AnimalsFeedMode;
  /** The page has no gutters: posts go edge to edge, text keeps padding. */
  isFullBleed?: boolean;
};

export function AnimalList({
  mode = "discover",
  isFullBleed = false,
}: AnimalListProps) {
  const { items, total, query, preferences } = useAnimalsFeed(mode);
  const router = useRouter();
  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-4 empty:hidden",
          isFullBleed && "px-4",
        )}
      >
        <QueryStatus query={query} hasPendingText={false} />
        <QueryStatus query={preferences} hasPendingText={false} />
      </div>
      {query.isPending || preferences.isPending ? <LoadingState /> : null}
      {query.data && !items.length ? (
        <EmptyState icon={EMPTY_ICONS[mode]}>
          Nenhum animal encontrado.
        </EmptyState>
      ) : null}
      {items.length ? (
        <p
          className={cn("text-sm text-neutral-600", isFullBleed && "px-4 pt-4")}
        >
          {total === 1
            ? "1 animal"
            : `${total.toLocaleString("pt-BR")} animais`}
        </p>
      ) : null}
      <ul>
        {items.map((item) => (
          <FeedPost
            key={item.id}
            item={item}
            isHidden={item.isHidden}
            onHiddenChange={() => router.refresh()}
            showPetStatus
          />
        ))}
      </ul>
      {query.hasNextPage ? (
        <Button
          className={isFullBleed ? "mx-4" : undefined}
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Carregar mais animais
        </Button>
      ) : null}
    </>
  );
}
