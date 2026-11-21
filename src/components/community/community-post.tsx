"use client";
import { FeedPostMenu } from "@/components/posts/feed-post-menu";

import { OrganizationPost } from "@/components/posts/organization-post";
import { cn } from "@/components/ui";
import { communityMutations, postMediaHref } from "@/lib/api/community";
import type { PostResponse } from "@/lib/backend/contracts";
import { useMutation } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import type { ReactNode } from "react";
import { postIdentity } from "./organization-identity";

type CommunityPostProps = {
  post: PostResponse;
  /** Link the header to the public organization profile. */
  hasOrganizationLink?: boolean;
  headerAction?: ReactNode;
  /** Extra controls after the like button, such as NGO management links. */
  children?: ReactNode;
};

/** A Go standalone post with its embedded organization identity and idempotent likes. */
export function CommunityPost({
  post,
  hasOrganizationLink = true,
  headerAction,
  children,
}: CommunityPostProps) {
  const like = useMutation(communityMutations.likePost());
  // Show the requested state while Go confirms it; the list refetches after.
  const isLiked = like.isPending ? like.variables.liked : post.liked;
  const likeCount =
    post.likeCount + (isLiked === post.liked ? 0 : isLiked ? 1 : -1);

  function handleLike(liked: boolean) {
    if (like.isPending) return;
    like.mutate({ id: post.id, liked });
  }

  return (
    <div className="flex flex-col">
      <OrganizationPost
        organization={postIdentity(post)}
        organizationHref={
          hasOrganizationLink
            ? `/organizations/${encodeURIComponent(post.organizationId)}`
            : undefined
        }
        body={post.body}
        tags={post.tags}
        mediaUrls={post.mediaIds.map(postMediaHref)}
        createdAt={post.createdAt}
        isEdited={post.updatedAt !== post.createdAt}
        headerAction={
          headerAction ?? (
            <FeedPostMenu
              targetType="post"
              targetId={post.id}
              petId={null}
              isHidden={false}
              onHiddenChange={() => undefined}
            />
          )
        }
        onPhotoDoubleTap={() => {
          if (!isLiked) handleLike(true);
        }}
        actions={
          <>
            <button
              type="button"
              aria-pressed={isLiked}
              aria-label={
                isLiked ? "Descurtir publicação" : "Curtir publicação"
              }
              disabled={like.isPending}
              onClick={() => handleLike(!isLiked)}
              className={cn(
                "-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-secondary focus-visible:outline-2 focus-visible:outline-accent-tertiary disabled:opacity-60 motion-safe:transition-transform motion-safe:active:scale-90",
                isLiked ? "text-red-600" : "text-text",
              )}
            >
              <Heart
                className="size-6"
                fill={isLiked ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
            <p className="text-sm font-semibold">
              {likeCount === 1 ? "1 curtida" : `${likeCount} curtidas`}
            </p>
            {children ? (
              <div className="ml-auto flex items-center gap-2">{children}</div>
            ) : null}
          </>
        }
      />
      {like.error ? (
        <p role="alert" className="px-4 pb-2 text-sm text-red-700">
          {like.error.message}
        </p>
      ) : null}
    </div>
  );
}
