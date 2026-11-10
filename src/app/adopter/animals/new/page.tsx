import { AnimalForm } from "@/components/backend/animal-form";
import { BackendShell } from "@/components/backend/backend-shell";
import { getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  const user = await getCurrentUser();
  return (
    <BackendShell title="Encaminhar animal para uma ONG">
      <AnimalForm user={user} isPrivate />
    </BackendShell>
  );
}
