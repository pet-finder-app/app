import { BackendShell } from "@/components/backend/backend-shell";
import { PostList } from "@/components/community/post-list";
import { LinkButton } from "@/components/ui";
import { getCurrentUser } from "@/lib/backend/server";

export default async function Page() {
  await getCurrentUser();
  return (
    <BackendShell title="Publicações das ONGs que sigo">
      <LinkButton href="/adopter/following" variant="outline">
        ONGs que sigo
      </LinkButton>
      <PostList
        source={{ kind: "following" }}
        emptyMessage="Nenhuma publicação ainda. Siga ONGs para ver as novidades delas aqui."
      />
    </BackendShell>
  );
}
