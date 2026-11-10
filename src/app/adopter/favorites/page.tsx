import { AnimalList } from "@/components/backend/animal-list";
import { BackendShell } from "@/components/backend/backend-shell";
import { getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  return (
    <BackendShell title="Favoritos">
      <AnimalList mode="liked" />
    </BackendShell>
  );
}
