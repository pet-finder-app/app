import { BackendShell } from "@/components/backend/backend-shell";
import { FollowingList } from "@/components/community/following-list";
import { LinkButton } from "@/components/ui";
import { getCurrentUser } from "@/lib/backend/server";

export default async function Page() {
  await getCurrentUser();
  return (
    <BackendShell title="ONGs que sigo">
      <LinkButton href="/feed" variant="outline">
        Ver publicações das ONGs que sigo
      </LinkButton>
      <FollowingList />
    </BackendShell>
  );
}
