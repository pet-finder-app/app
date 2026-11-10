import { BackendShell } from "@/components/backend/backend-shell";
import { VERIFICATION_LABELS } from "@/components/backend/labels";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { LinkButton } from "@/components/ui";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title={organization?.name ?? "Organizações"} organization>
      {organization ? (
        <>
          <p>
            {VERIFICATION_LABELS[organization.verificationStatus] ??
              "Situação não informada"}
          </p>
          <p>{organization.description}</p>
          <LinkButton href="/ngo/pets">Animais publicados</LinkButton>
          <LinkButton href="/ngo/adoptions">Pedidos de adoção</LinkButton>
          <LinkButton href="/ngo/messages">Conversas</LinkButton>
          <LinkButton href="/ngo/settings">Editar ONG</LinkButton>
          <LinkButton href="/ngo/team">Equipe</LinkButton>
        </>
      ) : (
        <OrganizationSelection />
      )}
    </BackendShell>
  );
}
