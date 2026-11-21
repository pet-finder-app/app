import { OrganizationAnalyticsPanel } from "@/components/animals/organization-analytics-panel";
import { BackendShell } from "@/components/backend/backend-shell";
import { VERIFICATION_LABELS } from "@/components/backend/labels";
import { OrganizationSelection } from "@/components/backend/organization-selection";
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
  const isVerified = organization?.verificationStatus === "verified";
  return (
    <BackendShell title={organization?.name ?? "Organizações"} organization>
      {organization ? (
        <>
          <p>
            {VERIFICATION_LABELS[organization.verificationStatus] ??
              "Situação não informada"}
          </p>
          {isVerified ? null : (
            <p role="note">
              Enquanto a ONG não estiver verificada, ela não pode publicar
              animais nem aprovar adoções.
            </p>
          )}
          <p>{organization.description}</p>
          <LinkButton href="/ngo/pets">Animais da ONG</LinkButton>
          <LinkButton href="/ngo/adoptions">Pedidos de adoção</LinkButton>
          {membership?.canManageApplications ? (
            <>
              <LinkButton href="/ngo/surrenders">
                Entregas e devoluções
              </LinkButton>
              <LinkButton href="/ngo/settings/agreement">
                Modelos de termo
              </LinkButton>
            </>
          ) : null}
          <LinkButton href="/ngo/messages">Conversas</LinkButton>
          <LinkButton href="/ngo/posts">Publicações</LinkButton>
          {membership?.canManageMembers ? (
            <LinkButton href="/ngo/settings">
              {isVerified ? "Editar ONG" : "Editar ONG e enviar verificação"}
            </LinkButton>
          ) : null}
          {membership?.canManageMembers ? (
            <LinkButton href="/ngo/donations">Doações</LinkButton>
          ) : null}
          <LinkButton href="/ngo/team">Equipe</LinkButton>
          {membership?.canManageApplications ? (
            <OrganizationAnalyticsPanel organizationId={organization.id} />
          ) : null}
        </>
      ) : (
        <OrganizationSelection />
      )}
    </BackendShell>
  );
}
