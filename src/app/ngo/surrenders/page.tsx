import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { PermissionNotice } from "@/components/backend/permission-notice";
import { SurrenderList } from "@/components/workflows/surrender-list";
import {
  getCurrentMembership,
  getCurrentOrganization,
  getCurrentUser,
  isPlatformAdmin,
} from "@/lib/backend/server";
export default async function Page() {
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();
  const membership = await getCurrentMembership();
  return (
    <BackendShell title="Entregas e devoluções" organization>
      {!organization ? (
        <OrganizationSelection />
      ) : membership?.canManageApplications || isPlatformAdmin(user) ? (
        <SurrenderList organizationId={organization.id} />
      ) : (
        <PermissionNotice action="analisar entregas e devoluções de animais" />
      )}
    </BackendShell>
  );
}
