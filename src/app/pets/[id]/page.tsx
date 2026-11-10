import { AnimalDetail } from "@/components/backend/animal-detail";
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
    <BackendShell title="Sobre o animal" organization={Boolean(organization)}>
      <AnimalDetail
        id={id}
        userId={user.id}
        organizationId={organization?.id}
      />
    </BackendShell>
  );
}
