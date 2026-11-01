import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import {
  Badge,
  Card,
  CardTitle,
  cn,
  LinkButton,
  PageShell,
  shadowSoft,
} from "@/components/ui";
import {
  adoptionStageLabel,
  isAdoptionActive,
  whoActsNow,
} from "@/lib/adoption";
import { listAdoptionsByNgo } from "@/lib/adoptions";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Adoções – Petfinder",
};

/** NGO adoption dashboard with active cases, required actions, and history. */
export default async function NgoAdoptionsPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const adoptions = await listAdoptionsByNgo(user.id);
  const active = adoptions.filter((a) => isAdoptionActive(a.status));
  const finished = adoptions.filter((a) => !isAdoptionActive(a.status));

  const renderList = (list: typeof adoptions) => (
    <ul className="flex flex-col gap-2">
      {list.map((adoption) => (
        <li key={adoption.id}>
          <Link
            href={`/ngo/adoptions/${adoption.id}`}
            className={cn(
              "flex items-center gap-3 rounded-2xl bg-white p-3 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none",
              shadowSoft.md,
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-neutral-900">
                {adoption.petName} · {adoption.adopterName}
              </p>
              <p className="text-xs text-neutral-600">
                {adoptionStageLabel(adoption)}
              </p>
            </div>
            {whoActsNow(adoption) === "ngo" ? (
              <Badge tone="warning">Sua vez</Badge>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <CardTitle>Adoções</CardTitle>
        <p className="text-sm text-neutral-600">
          Para começar uma adoção, abra a conversa com a pessoa e toque em
          &ldquo;Iniciar adoção&rdquo;.
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/ngo/messages" variant="pill" size="sm">
            Ir para as mensagens
          </LinkButton>
          <LinkButton href="/ngo/settings/agreement" variant="pill" size="sm">
            Meu termo de adoção
          </LinkButton>
          <LinkButton href="/ngo/surrenders" variant="pill" size="sm">
            Pedidos para deixar um pet
          </LinkButton>
        </div>
      </Card>

      {active.length > 0 ? (
        renderList(active)
      ) : (
        <Card className="items-center gap-2 text-center">
          <p className="text-sm text-neutral-600">
            Nenhuma adoção em andamento.
          </p>
        </Card>
      )}

      {finished.length > 0 ? (
        <>
          <h2 className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
            Encerradas
          </h2>
          {renderList(finished)}
        </>
      ) : null}

      <NgoTabBar />
    </PageShell>
  );
}
