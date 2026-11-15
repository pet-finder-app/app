import { AnimalInventory } from "@/components/backend/animal-inventory";
import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { LinkButton } from "@/components/ui";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Animais da ONG" organization>
      {organization ? (
        <>
          <LinkButton href="/ngo/pets/new">Cadastrar animal</LinkButton>
          <AnimalInventory organizationId={organization.id} />
        </>
      ) : (
        <OrganizationSelection />
      )}
    </BackendShell>
  );
}
