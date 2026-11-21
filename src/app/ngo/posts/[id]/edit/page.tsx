import { BackendShell } from "@/components/backend/backend-shell";
import { PermissionNotice } from "@/components/backend/permission-notice";
import { loadPost } from "@/components/community/load-post";
import { PostForm } from "@/components/community/post-form";
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
  const user = await getCurrentUser();
  const [post, organization, membership] = await Promise.all([
    loadPost(id),
    getCurrentOrganization(),
    getCurrentMembership(),
  ]);
  const canManage =
    organization?.id === post.organizationId &&
    Boolean(membership?.canPublishAnimals);
  return (
    <BackendShell title="Editar publicação" organization>
      {canManage ? (
        <PostForm
          organizationId={post.organizationId}
          post={post}
          currentUserId={user.id}
        />
      ) : (
        <PermissionNotice action="editar publicações desta ONG" />
      )}
    </BackendShell>
  );
}
