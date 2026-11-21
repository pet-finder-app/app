import { AnimalInventory } from "@/components/backend/animal-inventory";
import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { LinkButton } from "@/components/ui";
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
    <BackendShell title="Animais da ONG" organization>
      {organization ? (
        <>
          {membership?.canPublishAnimals &&
          organization.verificationStatus === "verified" ? (
            <LinkButton href="/ngo/pets/new">Cadastrar animal</LinkButton>
          ) : null}
          <AnimalInventory organizationId={organization.id} />
        </>
      ) : (
        <OrganizationSelection />
      )}
    </BackendShell>
  );
}
