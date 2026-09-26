import {
  Card,
  CardTitle,
  LinkButton,
  PageShell,
  Progress,
} from "@/components/ui";
import { VerificationBadge } from "@/components/verification-badge";
import { getOngChecklist } from "@/lib/ong";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function App() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ong" && user.ong) {
    const checklist = getOngChecklist(user.ong);
    const done = checklist.filter((item) => item.done).length;
    const status = user.ong.verification.status;

    return (
      <PageShell>
        <Card as="header" className="gap-1">
          <p className="text-sm text-neutral-600">Olá,</p>
          <h1 className="text-2xl font-bold text-neutral-900">{user.name}</h1>
          <div className="mt-1">
            <VerificationBadge status={status} />
          </div>
        </Card>

        <Card className="gap-3">
          <CardTitle>
            {status === "verificada"
              ? "Sua ONG está verificada"
              : status === "em_analise"
                ? "Cadastro em análise"
                : "Complete o cadastro para publicar pets"}
          </CardTitle>
          <p className="text-sm text-neutral-600">
            {status === "verificada"
              ? "Você já pode publicar pets para adoção."
              : status === "em_analise"
                ? "Estamos conferindo seus documentos. Avisamos por e-mail quando terminar."
                : "Você pode explorar o app à vontade. Os documentos só são exigidos na hora de publicar o primeiro pet."}
          </p>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Checklist</span>
              <span>
                {done}/{checklist.length}
              </span>
            </div>
            <Progress
              value={done}
              max={checklist.length}
              label="Itens do cadastro concluídos"
            />
          </div>

          <LinkButton href="/ong/perfil" size="lg" className="mt-1">
            {status === "pendente" ? "COMPLETAR CADASTRO" : "VER PERFIL DA ONG"}
          </LinkButton>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="justify-center">
      <p className="text-center text-sm text-neutral-600">Conteúdo principal</p>
    </PageShell>
  );
}
