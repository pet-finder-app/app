import {
  collectionResponseNotificationResponseSchema,
  collectionResponseOrganizationResponseSchema,
  collectionResponsePostResponseSchema,
  conversationReadStateSchema,
  countResponseSchema,
  organizationFollowersResponseSchema,
  postResponseSchema,
  unreadConversationsSchema,
} from "@/lib/backend/contracts";
import {
  infiniteQueryOptions,
  mutationOptions,
  queryOptions,
} from "@tanstack/react-query";
import { z } from "zod";
import { requestData } from "./client";
import { queryKeys } from "./keys";
import { body } from "./mutations";
import { nextPageParam } from "./pagination";
import { backendPath } from "./queries";

/** Go caps collection pages at 100 items; posts load in smaller batches. */
export const POST_PAGE_SIZE = 20;
const LIST_PAGE_SIZE = 50;
/** Unread badges poll modestly; Go has no push channel for notifications. */
export const UNREAD_POLL_MS = 60_000;
/** Limits from Go's postRequest contract. */
export const POST_BODY_MAX = 10_000;
export const POST_MEDIA_MAX = 20;
export const POST_TAGS_MAX = 20;

export type PostSource =
  | { kind: "organization"; organizationId: string }
  | { kind: "following" }
  | { kind: "all" };

export const communityKeys = {
  posts: ["posts"],
  postList: (source: PostSource) =>
    [
      "posts",
      "list",
      source.kind,
      source.kind === "organization" ? source.organizationId : "all",
    ] as const,
  post: (id: string) => ["posts", "detail", id] as const,
  followers: (organizationId: string) =>
    [...queryKeys.organization(organizationId), "followers"] as const,
  following: [...queryKeys.organizations, "following"] as const,
  notifications: ["notifications"],
  notificationList: ["notifications", "list"],
  notificationUnread: ["notifications", "unread"],
  conversationUnread: [...queryKeys.conversations, "unread"] as const,
  readState: (conversationId: string) =>
    [...queryKeys.conversations, conversationId, "read-state"] as const,
} as const;

export const communityMutationKeys = {
  post: (action: string) => ["posts", action] as const,
  like: ["posts", "like"],
  follow: ["organizations", "follow"],
  notificationRead: ["notifications", "read"],
  conversationRead: ["conversations", "read"],
} as const;

/** Browser URL for a post media id, read through the authenticated proxy. */
export const postMediaHref = (mediaId: string) =>
  backendPath(`/v1/media/${encodeURIComponent(mediaId)}`);

const emptyResult = z.null();

function postListPath(source: PostSource, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(POST_PAGE_SIZE),
  });
  if (source.kind === "following") return `/v1/feed?${params}`;
  if (source.kind === "organization")
    params.set("organization_id", source.organizationId);
  return `/v1/posts?${params}`;
}

export function postListOptions(source: PostSource) {
  return infiniteQueryOptions({
    queryKey: communityKeys.postList(source),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      requestData(
        backendPath(postListPath(source, pageParam)),
        collectionResponsePostResponseSchema,
        { signal },
      ),
    getNextPageParam: nextPageParam,
  });
}

export function postOptions(id: string) {
  return queryOptions({
    queryKey: communityKeys.post(id),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/posts/${encodeURIComponent(id)}`),
        postResponseSchema,
        { signal },
      ),
  });
}

export function followersOptions(organizationId: string) {
  return queryOptions({
    queryKey: communityKeys.followers(organizationId),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(
          `/v1/organizations/${encodeURIComponent(organizationId)}/followers`,
        ),
        organizationFollowersResponseSchema,
        { signal },
      ),
  });
}

export function followingOptions() {
  return infiniteQueryOptions({
    queryKey: communityKeys.following,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      requestData(
        backendPath(
          `/v1/me/following?page=${pageParam}&page_size=${LIST_PAGE_SIZE}`,
        ),
        collectionResponseOrganizationResponseSchema,
        { signal },
      ),
    getNextPageParam: nextPageParam,
  });
}

export function notificationsOptions() {
  return infiniteQueryOptions({
    queryKey: communityKeys.notificationList,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      requestData(
        backendPath(
          `/v1/notifications?page=${pageParam}&page_size=${LIST_PAGE_SIZE}`,
        ),
        collectionResponseNotificationResponseSchema,
        { signal },
      ),
    getNextPageParam: nextPageParam,
  });
}

export function notificationUnreadOptions() {
  return queryOptions({
    queryKey: communityKeys.notificationUnread,
    queryFn: ({ signal }) =>
      requestData(
        backendPath("/v1/notifications/unread"),
        countResponseSchema,
        { signal },
      ),
    refetchInterval: UNREAD_POLL_MS,
  });
}

export function conversationUnreadOptions() {
  return queryOptions({
    queryKey: communityKeys.conversationUnread,
    queryFn: ({ signal }) =>
      requestData(
        backendPath("/v1/conversations/unread"),
        unreadConversationsSchema,
        { signal },
      ),
    refetchInterval: UNREAD_POLL_MS,
  });
}

export function readStateOptions(conversationId: string) {
  return queryOptions({
    queryKey: communityKeys.readState(conversationId),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(
          `/v1/conversations/${encodeURIComponent(conversationId)}/read-state`,
        ),
        conversationReadStateSchema,
        { signal },
      ),
  });
}

export type PostInput = { body: string; mediaIds: string[]; tags: string[] };

/** Split free text into unique tags without the leading "#". */
export function parseTags(value: string): string[] {
  const tags = value
    .split(/[\s,]+/)
    .map((tag) => tag.replace(/^#+/, "").trim())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

const postMeta = { invalidates: [communityKeys.posts] };

export const communityMutations = {
  createPost: () =>
    mutationOptions({
      mutationKey: communityMutationKeys.post("create"),
      meta: postMeta,
      mutationFn: (input: { organizationId: string; post: PostInput }) =>
        requestData(
          backendPath(
            `/v1/organizations/${encodeURIComponent(input.organizationId)}/posts`,
          ),
          postResponseSchema,
          body(input.post),
        ),
    }),
  updatePost: () =>
    mutationOptions({
      mutationKey: communityMutationKeys.post("update"),
      meta: postMeta,
      mutationFn: (input: { id: string; post: PostInput }) =>
        requestData(
          backendPath(`/v1/posts/${encodeURIComponent(input.id)}`),
          postResponseSchema,
          body(input.post, "PUT"),
        ),
    }),
  deletePost: () =>
    mutationOptions({
      mutationKey: communityMutationKeys.post("delete"),
      meta: postMeta,
      mutationFn: (id: string) =>
        requestData(
          backendPath(`/v1/posts/${encodeURIComponent(id)}`),
          emptyResult,
          { method: "DELETE" },
        ),
    }),
  /** Idempotent: PUT likes, DELETE removes the like. */
  likePost: () =>
    mutationOptions({
      mutationKey: communityMutationKeys.like,
      meta: postMeta,
      mutationFn: async (input: { id: string; liked: boolean }) => {
        await requestData(
          backendPath(`/v1/posts/${encodeURIComponent(input.id)}/like`),
          emptyResult,
          { method: input.liked ? "PUT" : "DELETE" },
        );
        return { liked: input.liked };
      },
    }),
  /** Idempotent: PUT follows, DELETE unfollows. */
  follow: () =>
    mutationOptions({
      mutationKey: communityMutationKeys.follow,
      meta: {
        invalidates: [
          communityKeys.following,
          communityKeys.postList({ kind: "following" }),
        ],
      },
      mutationFn: async (input: {
        organizationId: string;
        following: boolean;
      }) => {
        await requestData(
          backendPath(
            `/v1/organizations/${encodeURIComponent(input.organizationId)}/follow`,
          ),
          emptyResult,
          { method: input.following ? "PUT" : "DELETE" },
        );
        return input;
      },
    }),
  /** Without an id, marks every notification read. */
  readNotifications: () =>
    mutationOptions({
      mutationKey: communityMutationKeys.notificationRead,
      meta: { invalidates: [communityKeys.notifications] },
      mutationFn: (id?: string) =>
        requestData(
          backendPath(
            id
              ? `/v1/notifications/${encodeURIComponent(id)}/read`
              : "/v1/notifications/read",
          ),
          emptyResult,
          { method: "PUT" },
        ),
    }),
  /**
   * Advance the read cursor; Go never moves it backwards. Go also marks the
   * conversation's message notifications read, so their badge refreshes too.
   */
  markConversationRead: () =>
    mutationOptions({
      mutationKey: communityMutationKeys.conversationRead,
      meta: {
        invalidates: [
          communityKeys.conversationUnread,
          communityKeys.notifications,
        ],
      },
      mutationFn: (input: { conversationId: string; messageId: string }) =>
        requestData(
          backendPath(
            `/v1/conversations/${encodeURIComponent(input.conversationId)}/read-state`,
          ),
          conversationReadStateSchema,
          body({ messageId: input.messageId }, "PUT"),
        ),
    }),
};
