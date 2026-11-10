import { LinkButton } from "@/components/ui";
import { BackendShell } from "./backend-shell";

export function UnsupportedFeature({ title }: { title: string }) {
  return (
    <BackendShell title={title}>
      <p>Este recurso ainda não está disponível.</p>
      <LinkButton href="/me" variant="outline">
        Voltar ao perfil
      </LinkButton>
    </BackendShell>
  );
}
