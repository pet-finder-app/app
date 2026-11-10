import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationForm } from "@/components/backend/organization-form";
import { getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  const user = await getCurrentUser();
  return (
    <BackendShell title="Cadastrar ONG">
      <OrganizationForm user={user} />
    </BackendShell>
  );
}
