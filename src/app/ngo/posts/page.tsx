import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { PostList } from "@/components/community/post-list";
import { LinkButton } from "@/components/ui";
import {
  getCurrentMembership,
  getCurrentOrganization,
  getCurrentUser,
} from "@/lib/backend/server";

export default async function Page() {
  await getCurrentUser();
  const organization = await getCurrentOrganization();
  const membership = await getCurrentMembership();
  if (!organization)
    return (
      <BackendShell title="Publicações" organization>
        <OrganizationSelection />
      </BackendShell>
    );
  const isVerified = organization.verificationStatus === "verified";
  return (
    <BackendShell title="Publicações" organization>
      {!isVerified ? (
        <p role="note">
          Somente ONGs verificadas publicam e exibem publicações. Conclua a
          verificação nas configurações da ONG.
        </p>
      ) : membership?.canPublishAnimals ? (
        <LinkButton href="/ngo/posts/new">Nova publicação</LinkButton>
      ) : (
        <p role="note">
          Sua função nesta ONG não permite publicar. Peça a um coordenador da
          equipe.
        </p>
      )}
      {isVerified ? (
        <>
          <LinkButton
            href={`/organizations/${encodeURIComponent(organization.id)}`}
            variant="outline"
          >
            Ver perfil público
          </LinkButton>
          <PostList
            source={{ kind: "organization", organizationId: organization.id }}
            emptyMessage="A ONG ainda não publicou nada."
            isManaging
            hasOrganizationLink={false}
          />
        </>
      ) : null}
    </BackendShell>
  );
}
