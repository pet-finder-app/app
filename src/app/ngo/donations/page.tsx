import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { PermissionNotice } from "@/components/backend/permission-notice";
import { DonationList } from "@/components/donations/donation-list";
import { DonationTotals } from "@/components/donations/donation-totals";
import {
  getCurrentMembership,
  getCurrentOrganization,
  getCurrentUser,
} from "@/lib/backend/server";

export default async function Page() {
  await getCurrentUser();
  const organization = await getCurrentOrganization();
  const membership = await getCurrentMembership();
  return (
    <BackendShell title="Doações recebidas" organization>
      {!organization ? (
        <OrganizationSelection />
      ) : membership?.canManageMembers ? (
        <>
          <p className="text-sm text-neutral-600">
            O Petfinder não processa pagamentos. Estas são transferências
            diretas informadas por doadores. Confira cada uma no extrato da ONG
            antes de confirmar.
          </p>
          <DonationTotals organizationId={organization.id} />
          <section
            aria-labelledby="organization-donations"
            className="flex flex-col gap-3"
          >
            <h2 id="organization-donations" className="text-lg font-bold">
              Doações informadas
            </h2>
            <DonationList organizationId={organization.id} />
          </section>
        </>
      ) : (
        <PermissionNotice action="ver nem conferir as doações da ONG" />
      )}
    </BackendShell>
  );
}
