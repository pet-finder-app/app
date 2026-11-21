"use client";

import { Button, FormError } from "@/components/ui";
import { communityMutations, followersOptions } from "@/lib/api/community";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";

type FollowButtonProps = {
  organizationId: string;
  /** Show the follower count beside the button. */
  hasCount?: boolean;
};

function followerLabel(count: number) {
  return count === 1 ? "1 seguidor" : `${count} seguidores`;
}

/** Follow or unfollow a verified organization (idempotent in Go). */
export function FollowButton({
  organizationId,
  hasCount = true,
}: FollowButtonProps) {
  const errorId = useId();
  const client = useQueryClient();
  const query = useQuery(followersOptions(organizationId));
  const mutation = useMutation({
    ...communityMutations.follow(),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: followersOptions(organizationId).queryKey,
      }),
  });
  // Go returns 404 for organizations that cannot be followed (not verified).
  if (query.isError || !query.data) return null;
  const isFollowing = mutation.isPending
    ? mutation.variables.following
    : query.data.following;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant={isFollowing ? "outline" : "primary"}
          aria-pressed={isFollowing}
          aria-describedby={errorId}
          loading={mutation.isPending}
          onClick={() =>
            mutation.mutate({ organizationId, following: !isFollowing })
          }
        >
          {isFollowing ? "Seguindo" : "Seguir"}
        </Button>
        {hasCount ? (
          <span className="text-sm text-neutral-600">
            {followerLabel(query.data.followerCount)}
          </span>
        ) : null}
      </div>
      <FormError id={errorId} collapsible>
        {mutation.error?.message}
      </FormError>
    </div>
  );
}
