import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { PermissionNotice } from "@/components/backend/permission-notice";
import { TemplateManager } from "@/components/workflows/template-manager";
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
  const isAdmin = isPlatformAdmin(user);
  // Go lists and publishes templates for `can_manage_applications` members.
  const canManage = isAdmin || Boolean(membership?.canManageApplications);
  return (
    <BackendShell title="Modelos de termo" organization>
      {!organization ? (
        <OrganizationSelection />
      ) : canManage ? (
        <>
          <p>
            Modelos usados nos termos de adoção e de entrega ou devolução. Os
            nomes e a data são preenchidos automaticamente quando a ONG cria o
            termo de um pedido.
          </p>
          <TemplateManager organizationId={organization.id} canList canCreate />
        </>
      ) : (
        <PermissionNotice action="ver os modelos de termo" />
      )}
    </BackendShell>
  );
}
