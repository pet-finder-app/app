import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { OrganizationTeam } from "@/components/backend/organization-team";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Equipe da ONG" organization>
      {organization ? (
        <OrganizationTeam organizationId={organization.id} userId={user.id} />
      ) : (
        <OrganizationSelection />
      )}
    </BackendShell>
  );
}
