import { ApplicationDetail } from "@/components/backend/application-detail";
import { BackendShell } from "@/components/backend/backend-shell";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Pedido de adoção" organization={Boolean(organization)}>
      <ApplicationDetail id={id} userId={user.id} />
    </BackendShell>
  );
}
