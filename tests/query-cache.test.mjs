import assert from "node:assert/strict";
import { test } from "node:test";
import { animal, collection, organization } from "./fixtures/backend.mjs";
import "./resolve-app.mjs";

const { createQueryClient } = await import("../src/lib/api/query-client.ts");
const { apiMutations } = await import("../src/lib/api/mutations.ts");
const { queryKeys } = await import("../src/lib/api/keys.ts");
const execute = (client, options, input) =>
  client.getMutationCache().build(client, options).execute(input);

test("unlike refreshes an active composed feed after its preference dependency becomes stale", async (t) => {
  const { QueryObserver } = await import("@tanstack/react-query");
  const { preferencesOptions } = await import("../src/lib/api/queries.ts");
  const client = createQueryClient();
  t.after(() => client.clear());
  let isLiked = true;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    if (options.method === "DELETE") {
      isLiked = false;
      return new Response(null, { status: 204 });
    }
    return Response.json(
      collection(
        isLiked
          ? [
              {
                ...animal,
                organization_name: organization.name,
                organization_slug: null,
                preference: "liked",
                preference_updated_at: null,
              },
            ]
          : [],
      ),
    );
  });
  const feed = {
    queryKey: queryKeys.feed("liked", "none"),
    queryFn: () => client.fetchQuery(preferencesOptions("liked")),
  };
  await client.fetchQuery(feed);
  const observer = new QueryObserver(client, feed);
  const unsubscribe = observer.subscribe(() => undefined);
  t.after(unsubscribe);
  assert.equal(client.getQueryData(feed.queryKey).items.length, 1);
  await execute(client, apiMutations.like(), {
    type: "pet",
    id: animal.id,
    liked: true,
  });
  assert.equal(client.getQueryData(feed.queryKey).items.length, 0);
});
