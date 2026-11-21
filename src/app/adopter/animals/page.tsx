import { AnimalInventory } from "@/components/backend/animal-inventory";
import { BackendShell } from "@/components/backend/backend-shell";
import { LinkButton } from "@/components/ui";
import { getCurrentUser } from "@/lib/backend/server";

export default async function Page() {
  const user = await getCurrentUser();
  return (
    <BackendShell title="Animais que encaminhei">
      <LinkButton href="/adopter/animals/new">
        Encaminhar animal para uma ONG
      </LinkButton>
      <AnimalInventory userId={user.id} />
    </BackendShell>
  );
}
