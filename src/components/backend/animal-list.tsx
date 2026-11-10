"use client";
import { FeedPost } from "@/components/posts/feed-post";
import { Button } from "@/components/ui";
import {
  useAnimalsFeed,
  type AnimalsFeedMode,
} from "@/lib/api/use-animals-feed";
import { useRouter } from "next/navigation";
import { QueryStatus } from "./query-status";

export function AnimalList({
  mode = "discover",
  organizationId,
}: {
  mode?: AnimalsFeedMode;
  organizationId?: string;
}) {
  const { items, query, preferences } = useAnimalsFeed(mode);
  const router = useRouter();
  return (
    <>
      <QueryStatus query={query} />
      <QueryStatus query={preferences} />
      {query.data && !items.length ? <p>Nenhum animal encontrado.</p> : null}
      <ul>
        {items
          .filter(
            (item) => !organizationId || item.organizationId === organizationId,
          )
          .map((item) => (
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
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Carregar mais animais
        </Button>
      ) : null}
    </>
  );
}
