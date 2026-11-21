import { DeleteAccountButton } from "@/components/account/delete-account-button";
import { BackendShell } from "@/components/backend/backend-shell";
import { PERSONAL_VERIFICATION_LABELS } from "@/components/backend/labels";
import { ProfileForm } from "@/components/backend/profile-form";
import { VerificationPanel } from "@/components/backend/verification-panel";
import { LinkButton } from "@/components/ui";
import {
  getCurrentOrganization,
  getCurrentUser,
  isPlatformAdmin,
} from "@/lib/backend/server";
export default async function ProfilePage() {
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Meu perfil" organization={Boolean(organization)}>
      <ProfileForm user={user} organization={organization} />
      <VerificationPanel
        statusLabel={
          PERSONAL_VERIFICATION_LABELS[user.verificationStatus] ??
          "Situação não informada"
        }
      />
      <LinkButton href="/feed" variant="outline">
        Publicações das ONGs que sigo
      </LinkButton>
      <LinkButton href="/adopter/following" variant="outline">
        ONGs que sigo
      </LinkButton>
      <LinkButton href="/adopter/donate" variant="outline">
        Doações
      </LinkButton>
      <LinkButton href="/adopter/surrenders" variant="outline">
        Entregar ou devolver um animal
      </LinkButton>
      {isPlatformAdmin(user) ? (
        <LinkButton href="/admin/verifications" variant="outline">
          Analisar verificações
        </LinkButton>
      ) : null}
      <DeleteAccountButton />
    </BackendShell>
  );
}
