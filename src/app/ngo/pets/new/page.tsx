import { AnimalForm } from "@/components/backend/animal-form";
import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Cadastrar animal" organization>
      {!organization ? (
        <OrganizationSelection />
      ) : organization.verificationStatus !== "verified" ? (
        <p>A ONG precisa estar verificada para publicar animais.</p>
      ) : (
        <AnimalForm user={user} organization={organization} />
      )}
    </BackendShell>
  );
}
