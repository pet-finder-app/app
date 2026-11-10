import { BackendShell } from "@/components/backend/backend-shell";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  return (
    <BackendShell title="Organizações">
      <OrganizationSelection />
    </BackendShell>
  );
}
