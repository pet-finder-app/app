import { BackendShell } from "@/components/backend/backend-shell";
import { DeletePostButton } from "@/components/community/delete-post-button";
import { loadPost } from "@/components/community/load-post";
import { PostDetail } from "@/components/community/post-detail";
import { LinkButton } from "@/components/ui";
import {
  getCurrentMembership,
  getCurrentOrganization,
  getCurrentUser,
} from "@/lib/backend/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentUser();
  const [post, organization, membership] = await Promise.all([
    loadPost(id),
    getCurrentOrganization(),
    getCurrentMembership(),
  ]);
  const canManage =
    organization?.id === post.organizationId &&
    Boolean(membership?.canPublishAnimals);
  return (
    <BackendShell title="Publicação" organization>
      <PostDetail postId={post.id} />
      {canManage ? (
        <div className="flex flex-col gap-2">
          <LinkButton href={`/ngo/posts/${encodeURIComponent(post.id)}/edit`}>
            Editar publicação
          </LinkButton>
          <DeletePostButton postId={post.id} />
        </div>
      ) : null}
      <LinkButton href="/ngo/posts" variant="outline">
        Voltar às publicações
      </LinkButton>
    </BackendShell>
  );
}
