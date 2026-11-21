"use client";

import { QueryStatus } from "@/components/backend/query-status";
import { postOptions } from "@/lib/api/community";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { CommunityPost } from "./community-post";

type PostDetailProps = { postId: string; children?: ReactNode };

/** A single post kept fresh in the browser cache, so likes update in place. */
export function PostDetail({ postId, children }: PostDetailProps) {
  const query = useQuery(postOptions(postId));
  return (
    <>
      <QueryStatus query={query} />
      {query.data ? (
        <div className="-mx-4">
          <CommunityPost post={query.data}>{children}</CommunityPost>
        </div>
      ) : null}
    </>
  );
}
