import { ApplicationList } from "@/components/backend/application-list";
import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Pedidos sobre o animal" organization>
      {organization ? (
        <ApplicationList organizationId={organization.id} animalId={id} />
      ) : (
        <OrganizationSelection />
      )}
    </BackendShell>
  );
}
