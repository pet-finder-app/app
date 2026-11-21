import assert from "node:assert/strict";
import { test } from "node:test";
import "./resolve-app.mjs";
const { createQueryClient } = await import("../src/lib/api/query-client.ts");
const {
  communityKeys,
  communityMutations,
  parseTags,
  postListOptions,
  postMediaHref,
} = await import("../src/lib/api/community.ts");
const { queryKeys } = await import("../src/lib/api/keys.ts");
const { notificationHref, notificationLabel, NOTIFICATION_KINDS } =
  await import("../src/components/community/notification-labels.ts");
const execute = (client, options, input) =>
  client.getMutationCache().build(client, options).execute(input);
const post = {
  id: "post",
  organization_id: "org",
  organization_name: "Patas Felizes",
  organization_slug: "patas-felizes",
  organization_logo_url: null,
  author_id: "user",
  body: "Olá",
  media_ids: ["m1", "m2"],
  tags: ["gatos"],
  like_count: 1,
  liked: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

test("tags are split, stripped of # and deduplicated", () => {
  assert.deepEqual(parseTags("#gatos, cães  #gatos ##adocao"), [
    "gatos",
    "cães",
    "adocao",
  ]);
  assert.equal(postMediaHref("m1"), "/api/backend/v1/media/m1");
});

test("creating a post sends ordered media ids and tags in snake_case", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/backend/v1/organizations/org/posts");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), {
      body: "Olá",
      media_ids: ["m2", "m1"],
      tags: ["gatos"],
    });
    return Response.json(post, { status: 201 });
  });
  client.setQueryData(communityKeys.postList({ kind: "all" }), []);
  const saved = await execute(client, communityMutations.createPost(), {
    organizationId: "org",
    post: { body: "Olá", mediaIds: ["m2", "m1"], tags: ["gatos"] },
  });
  assert.deepEqual(saved.mediaIds, ["m1", "m2"]);
  assert.equal(
    client.getQueryState(communityKeys.postList({ kind: "all" })).isInvalidated,
    true,
  );
});

test("likes and follows use idempotent PUT and DELETE", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push(`${options.method} ${url}`);
    return new Response(null, { status: 204 });
  });
  await execute(client, communityMutations.likePost(), {
    id: "post",
    liked: true,
  });
  await execute(client, communityMutations.likePost(), {
    id: "post",
    liked: false,
  });
  client.setQueryData(communityKeys.following, []);
  await execute(client, communityMutations.follow(), {
    organizationId: "org",
    following: true,
  });
  await execute(client, communityMutations.follow(), {
    organizationId: "org",
    following: false,
  });
  assert.deepEqual(calls, [
    "PUT /api/backend/v1/posts/post/like",
    "DELETE /api/backend/v1/posts/post/like",
    "PUT /api/backend/v1/organizations/org/follow",
    "DELETE /api/backend/v1/organizations/org/follow",
  ]);
  assert.equal(
    client.getQueryState(communityKeys.following).isInvalidated,
    true,
  );
});

test("following feed and organization lists page through Go", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    return Response.json({
      items: [post],
      page: { page: 1, page_size: 20, total: 1 },
    });
  });
  const feed = await client.fetchInfiniteQuery(
    postListOptions({ kind: "following" }),
  );
  await client.fetchInfiniteQuery(
    postListOptions({ kind: "organization", organizationId: "org" }),
  );
  assert.equal(feed.pages[0].items[0].likeCount, 1);
  assert.equal(feed.pages[0].items[0].organizationName, "Patas Felizes");
  assert.equal(
    postListOptions({ kind: "following" }).getNextPageParam(
      feed.pages[0],
      feed.pages,
      1,
      feed.pageParams,
    ),
    undefined,
  );
  assert.deepEqual(urls, [
    "/api/backend/v1/feed?page=1&page_size=20",
    "/api/backend/v1/posts?page=1&page_size=20&organization_id=org",
  ]);
});

test("notification reads and conversation cursors refresh unread counts only", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push([`${options.method} ${url}`, options.body]);
    if (url.endsWith("/read-state"))
      return Response.json({
        conversation_id: "c",
        last_read_message_id: "m",
        unread_count: 0,
      });
    return new Response(null, { status: 204 });
  });
  client.setQueryData(communityKeys.notificationUnread, { count: 2 });
  client.setQueryData(communityKeys.conversationUnread, {});
  client.setQueryData(queryKeys.messages("c"), []);
  await execute(client, communityMutations.readNotifications(), "n");
  await execute(client, communityMutations.readNotifications(), undefined);
  const state = await execute(
    client,
    communityMutations.markConversationRead(),
    { conversationId: "c", messageId: "m" },
  );
  assert.equal(state.lastReadMessageId, "m");
  assert.deepEqual(calls, [
    ["PUT /api/backend/v1/notifications/n/read", undefined],
    ["PUT /api/backend/v1/notifications/read", undefined],
    [
      "PUT /api/backend/v1/conversations/c/read-state",
      JSON.stringify({ message_id: "m" }),
    ],
  ]);
  assert.equal(
    client.getQueryState(communityKeys.notificationUnread).isInvalidated,
    true,
  );
  assert.equal(
    client.getQueryState(communityKeys.conversationUnread).isInvalidated,
    true,
  );
  // Marking read must not refetch the live message history.
  assert.equal(
    client.getQueryState(queryKeys.messages("c")).isInvalidated,
    false,
  );
});

test("the conversation cursor also refreshes message notifications", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      conversation_id: "c",
      last_read_message_id: "m",
      unread_count: 0,
    }),
  );
  client.setQueryData(communityKeys.notificationUnread, { count: 1 });
  client.setQueryData(communityKeys.notificationList, { pages: [] });
  await execute(client, communityMutations.markConversationRead(), {
    conversationId: "c",
    messageId: "m",
  });
  for (const key of [
    communityKeys.notificationUnread,
    communityKeys.notificationList,
  ])
    assert.equal(client.getQueryState(key).isInvalidated, true);
});

test("post pages follow Go's total across all pages", async (t) => {
  const client = createQueryClient();
  t.after(() => client.clear());
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    const page = Number(new URL(url, "http://x").searchParams.get("page"));
    return Response.json({
      items: [{ ...post, id: `p${page}` }],
      page: { page, page_size: 20, total: 21 },
    });
  });
  const options = postListOptions({ kind: "all" });
  const first = await client.fetchInfiniteQuery(options);
  assert.equal(first.pages[0].page.total, 21);
  assert.equal(
    options.getNextPageParam(first.pages[0], first.pages, 1, first.pageParams),
    2,
  );
  const last = { items: [post], page: { page: 2, pageSize: 20, total: 21 } };
  assert.equal(options.getNextPageParam(last, [], 2, []), undefined);
});

const target = (kind, audience, extra = {}) => ({
  kind,
  subjectId: "s/1",
  applicationId: null,
  audience,
  ...extra,
});

test("every notification kind links to its page on the right side", () => {
  const app = { applicationId: "a1" };
  const cases = [
    [target("message", "requester"), "/adopter/conversations/s%2F1"],
    [target("message", "organization"), "/ngo/conversations/s%2F1"],
    [target("application", "requester", app), "/adopter/adoptions/a1"],
    [target("application", "organization", app), "/ngo/adoptions/a1"],
    [target("application", "requester"), "/adopter/adoptions/s%2F1"],
    [target("appointment", "requester", app), "/adopter/adoptions/a1"],
    [target("appointment", "organization", app), "/ngo/adoptions/a1"],
    [target("appointment", "requester"), null],
    [target("followup", "requester", app), "/adoptions/a1/follow-ups/s%2F1"],
    [
      target("followup_due", "organization", app),
      "/adoptions/a1/follow-ups/s%2F1",
    ],
    [target("followup", "requester"), null],
    [target("donation", "requester"), "/adopter/donate/history/s%2F1"],
    [target("donation", "organization"), "/ngo/donations/s%2F1"],
    [target("surrender", "requester"), "/adopter/surrenders/s%2F1"],
    [target("surrender", "organization"), "/ngo/surrenders/s%2F1"],
    [target("post", "requester"), "/feed/posts/s%2F1"],
    [target("verification", "requester"), "/me"],
    [target("unknown_kind", "requester"), null],
  ];
  for (const [input, href] of cases)
    assert.equal(
      notificationHref(input),
      href,
      `${input.kind}/${input.audience}`,
    );
  const covered = new Set(cases.map(([input]) => input.kind));
  for (const kind of NOTIFICATION_KINDS) assert.ok(covered.has(kind), kind);
  assert.equal(notificationLabel("unknown_kind"), "Nova notificação");
});
