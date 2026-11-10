import { AdopterTabBar } from "@/components/adopter/adopter-tab-bar";
import { PageShell } from "@/components/ui";
import { getCurrentUser } from "@/lib/backend/server";
import { isLocationEnabled } from "@/lib/location";
import { AnimalsFeed } from "./_components/backend-animals-feed";
import { readFeedQuery, type FeedSearchParams } from "./_components/feed-query";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<FeedSearchParams>;
}) {
  await getCurrentUser();
  const params = await searchParams;
  const filters = readFeedQuery(params, await isLocationEnabled());
  return (
    <PageShell hasActionBar className="px-0">
      <AnimalsFeed
        initialFilters={filters}
        initialPostId={typeof params.post === "string" ? params.post : null}
      />
      <AdopterTabBar />
    </PageShell>
  );
}
