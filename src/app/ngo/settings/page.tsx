import { BackendShell } from "@/components/backend/backend-shell";
import { VERIFICATION_LABELS } from "@/components/backend/labels";
import { OrganizationForm } from "@/components/backend/organization-form";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { PermissionNotice } from "@/components/backend/permission-notice";
import { VerificationPanel } from "@/components/backend/verification-panel";
import { OrganizationProfileSections } from "@/components/ngo/organization-profile-sections";
import { PaymentDetailsForm } from "@/components/ngo/payment-details-form";
import {
  getCurrentMembership,
  getCurrentOrganization,
  getCurrentUser,
} from "@/lib/backend/server";
export default async function Page() {
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();
  const membership = await getCurrentMembership();
  return (
    <BackendShell title="Configurações da ONG" organization>
      {!organization ? (
        <OrganizationSelection />
      ) : membership?.canManageMembers ? (
        <>
          <OrganizationForm user={user} organization={organization} />
          <OrganizationProfileSections organization={organization} />
          <PaymentDetailsForm
            organizationId={organization.id}
            isVerified={organization.verificationStatus === "verified"}
          />
          <VerificationPanel
            organizationId={organization.id}
            statusLabel={
              VERIFICATION_LABELS[organization.verificationStatus] ??
              "Situação não informada"
            }
          />
        </>
      ) : (
        <PermissionNotice action="editar os dados nem a verificação da ONG" />
      )}
    </BackendShell>
  );
}
