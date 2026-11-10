import { BackendShell } from "@/components/backend/backend-shell";
import { ProfileForm } from "@/components/backend/profile-form";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function ProfilePage() {
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Meu perfil" organization={Boolean(organization)}>
      <ProfileForm user={user} organization={organization} />
    </BackendShell>
  );
}
