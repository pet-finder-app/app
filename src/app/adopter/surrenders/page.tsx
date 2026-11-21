import { BackendShell } from "@/components/backend/backend-shell";
import { LinkButton } from "@/components/ui";
import { SurrenderList } from "@/components/workflows/surrender-list";
import { getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  return (
    <BackendShell title="Entregas e devoluções">
      <p>
        Acompanhe os animais que você pediu para uma ONG acolher ou que está
        devolvendo após a adoção.
      </p>
      <LinkButton href="/adopter/surrenders/new">Nova solicitação</LinkButton>
      <SurrenderList />
    </BackendShell>
  );
}
