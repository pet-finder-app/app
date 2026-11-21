"use client";
import { FeedPost } from "@/components/posts/feed-post";
import { Button } from "@/components/ui";
import {
  useAnimalsFeed,
  type AnimalsFeedMode,
} from "@/lib/api/use-animals-feed";
import { useRouter } from "next/navigation";
import { QueryStatus } from "./query-status";

export function AnimalList({ mode = "discover" }: { mode?: AnimalsFeedMode }) {
  const { items, total, query, preferences } = useAnimalsFeed(mode);
  const router = useRouter();
  return (
    <>
      <QueryStatus query={query} />
      <QueryStatus query={preferences} />
      {query.data && !items.length ? <p>Nenhum animal encontrado.</p> : null}
      {items.length ? (
        <p className="text-sm text-neutral-600">
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
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Carregar mais animais
        </Button>
      ) : null}
    </>
  );
}
