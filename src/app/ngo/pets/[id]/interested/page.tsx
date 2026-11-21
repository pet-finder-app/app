import { AnimalInterestPanel } from "@/components/animals/animal-interest-panel";
import { ApplicationList } from "@/components/backend/application-list";
import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { PermissionNotice } from "@/components/backend/permission-notice";
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
  const organization = await getCurrentOrganization();
  const membership = await getCurrentMembership();
  const canManageApplications =
    Boolean(membership?.canManageApplications) || user.roles.includes("admin");
  return (
    <BackendShell title="Interessados e pedidos" organization>
      {organization ? (
        <>
          {canManageApplications ? (
            <AnimalInterestPanel animalId={id} />
          ) : (
            <PermissionNotice action="ver os interessados neste animal" />
          )}
          <h2 className="mt-4 text-lg font-bold">Pedidos de adoção</h2>
          <ApplicationList organizationId={organization.id} animalId={id} />
        </>
      ) : (
        <OrganizationSelection />
      )}
    </BackendShell>
  );
}
