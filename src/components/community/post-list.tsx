"use client";

import { QueryStatus } from "@/components/backend/query-status";
import { Button, LinkButton } from "@/components/ui";
import { postListOptions, type PostSource } from "@/lib/api/community";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CommunityPost } from "./community-post";

type PostListProps = {
  source: PostSource;
  /** Message shown when Go returns no posts. */
  emptyMessage: string;
  /** Link each post to its NGO management page. */
  isManaging?: boolean;
  hasOrganizationLink?: boolean;
};

/** Paginated standalone posts from Go, newest first. */
export function PostList({
  source,
  emptyMessage,
  isManaging = false,
  hasOrganizationLink = true,
}: PostListProps) {
  const query = useInfiniteQuery(postListOptions(source));
  const posts = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.page.total ?? 0;
  return (
    <section aria-label="Publicações" className="flex flex-col gap-3">
      <QueryStatus query={query} />
      {query.data && posts.length === 0 ? <p>{emptyMessage}</p> : null}
      {total > 0 ? (
        <p className="text-sm text-neutral-600">
          {total === 1 ? "1 publicação" : `${total} publicações`}
        </p>
      ) : null}
      <ul className="-mx-4 flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.id}>
            <CommunityPost
              post={post}
              hasOrganizationLink={hasOrganizationLink}
            >
              {isManaging ? (
                <LinkButton
                  size="sm"
                  variant="outline"
                  href={`/ngo/posts/${encodeURIComponent(post.id)}`}
                >
                  Gerenciar
                </LinkButton>
              ) : (
                <LinkButton
                  size="sm"
                  variant="outline"
                  href={`/feed/posts/${encodeURIComponent(post.id)}`}
                >
                  Abrir
                </LinkButton>
              )}
            </CommunityPost>
          </li>
        ))}
      </ul>
      {query.hasNextPage ? (
        <Button
          variant="outline"
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Carregar mais publicações
        </Button>
      ) : null}
    </section>
  );
}
