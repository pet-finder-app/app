import { ApplicationList } from "@/components/backend/application-list";
import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Pedidos de adoção" organization={true}>
      {true && !organization ? (
        <OrganizationSelection />
      ) : (
        <ApplicationList organizationId={organization?.id} />
      )}
    </BackendShell>
  );
}
