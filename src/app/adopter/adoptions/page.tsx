import { ApplicationList } from "@/components/backend/application-list";
import { BackendShell } from "@/components/backend/backend-shell";
import { getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  return (
    <BackendShell title="Pedidos de adoção">
      <ApplicationList />
    </BackendShell>
  );
}
