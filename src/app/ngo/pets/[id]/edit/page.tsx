import { AnimalForm } from "@/components/backend/animal-form";
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
    <BackendShell title="Editar animal" organization={Boolean(organization)}>
      <AnimalForm id={id} user={user} organization={organization} />
    </BackendShell>
  );
}
