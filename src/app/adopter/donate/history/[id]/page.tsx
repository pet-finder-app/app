import { BackendShell } from "@/components/backend/backend-shell";
import { DonationDetail } from "@/components/donations/donation-detail";
import { TextLink } from "@/components/ui";
import { getCurrentUser } from "@/lib/backend/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentUser();
  return (
    <BackendShell title="Minha doação">
      <TextLink href="/adopter/donate">Voltar para minhas doações</TextLink>
      <DonationDetail donationId={id} />
    </BackendShell>
  );
}
