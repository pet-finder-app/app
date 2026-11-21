import { BackendShell } from "@/components/backend/backend-shell";
import { loadPost } from "@/components/community/load-post";
import { PostDetail } from "@/components/community/post-detail";
import { LinkButton } from "@/components/ui";
import { getCurrentUser } from "@/lib/backend/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentUser();
  const post = await loadPost(id);
  return (
    <BackendShell title="Publicação">
      <PostDetail postId={post.id} />
      <LinkButton
        href={`/organizations/${encodeURIComponent(post.organizationId)}`}
        variant="outline"
      >
        Ver perfil da ONG
      </LinkButton>
      <LinkButton href="/feed" variant="outline">
        Ver feed das ONGs que sigo
      </LinkButton>
    </BackendShell>
  );
}
