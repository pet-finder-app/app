import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationForm } from "@/components/backend/organization-form";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Configurações da ONG" organization>
      {organization ? (
        <OrganizationForm user={user} organization={organization} />
      ) : (
        <OrganizationSelection />
      )}
    </BackendShell>
  );
}
