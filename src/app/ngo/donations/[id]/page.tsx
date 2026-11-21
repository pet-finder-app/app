import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { PermissionNotice } from "@/components/backend/permission-notice";
import { DonationDetail } from "@/components/donations/donation-detail";
import { TextLink } from "@/components/ui";
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
  await getCurrentUser();
  const organization = await getCurrentOrganization();
  const membership = await getCurrentMembership();
  return (
    <BackendShell title="Doação recebida" organization>
      {!organization ? (
        <OrganizationSelection />
      ) : membership?.canManageMembers ? (
        <>
          <TextLink href="/ngo/donations">Voltar para doações</TextLink>
          <DonationDetail donationId={id} isOrganizationView />
        </>
      ) : (
        <PermissionNotice action="ver nem conferir as doações da ONG" />
      )}
    </BackendShell>
  );
}
