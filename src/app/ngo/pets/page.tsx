import { AnimalList } from "@/components/backend/animal-list";
import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { LinkButton } from "@/components/ui";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Animais publicados" organization>
      {organization ? (
        <>
          <p>
            Esta lista mostra os animais disponíveis publicados pela
            organização. A consulta dos cadastros pendentes e indisponíveis
            ainda não está disponível.
          </p>
          <LinkButton href="/ngo/pets/new">Cadastrar animal</LinkButton>
          <AnimalList organizationId={organization.id} />
        </>
      ) : (
        <OrganizationSelection />
      )}
    </BackendShell>
  );
}
