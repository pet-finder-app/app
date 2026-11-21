import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { PermissionNotice } from "@/components/backend/permission-notice";
import { PostForm } from "@/components/community/post-form";
import { LinkButton } from "@/components/ui";
import {
  getCurrentMembership,
  getCurrentOrganization,
  getCurrentUser,
} from "@/lib/backend/server";

export default async function Page() {
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();
  const membership = await getCurrentMembership();
  return (
    <BackendShell title="Nova publicação" organization>
      {!organization ? (
        <OrganizationSelection />
      ) : !membership?.canPublishAnimals ? (
        <PermissionNotice action="publicar em nome da ONG" />
      ) : organization.verificationStatus !== "verified" ? (
        <>
          <p role="note">
            Somente ONGs verificadas podem publicar. Conclua a verificação nas
            configurações da ONG.
          </p>
          <LinkButton href="/ngo/posts" variant="outline">
            Voltar às publicações
          </LinkButton>
        </>
      ) : (
        <PostForm organizationId={organization.id} currentUserId={user.id} />
      )}
    </BackendShell>
  );
}
