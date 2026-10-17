import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import {
  Badge,
  Card,
  CardTitle,
  cn,
  iconSize,
  LinkButton,
  PageShell,
  shadowSoft,
} from "@/components/ui";
import {
  isSurrenderActive,
  SURRENDER_STATUS_LABEL,
  whoActsNow,
} from "@/lib/surrender";
import { listSurrendersByNgo } from "@/lib/surrenders";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pedidos de acolhimento – Petfinder",
};

/** Pending surrender requests and their history. */
export default async function NgoSurrendersPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const surrenders = await listSurrendersByNgo(user.id);
  const active = surrenders.filter((s) => isSurrenderActive(s.status));
  const finished = surrenders.filter((s) => !isSurrenderActive(s.status));

  const renderList = (list: typeof surrenders) => (
    <ul className="flex flex-col gap-2">
      {list.map((surrender) => (
        <li key={surrender.id}>
          <Link
            href={`/ngo/surrenders/${surrender.id}`}
            className={cn(
              "flex items-center gap-3 rounded-2xl bg-white p-3 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none",
              shadowSoft.md,
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-neutral-900">
                {surrender.pet.name} · {surrender.adopterName}
              </p>
              <p className="text-xs text-neutral-600">
                {surrender.adoptionId ? "Devolução · " : ""}
                {SURRENDER_STATUS_LABEL[surrender.status]}
              </p>
            </div>
            {whoActsNow(surrender) === "ngo" &&
            isSurrenderActive(surrender.status) ? (
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
        <LinkButton
          href="/ngo/adoptions"
          variant="pill"
          size="sm"
          className="self-start"
        >
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Adoções
        </LinkButton>
        <CardTitle>Pedidos de acolhimento</CardTitle>
        <p className="text-sm text-neutral-600">
          Pessoas que não podem mais ficar com um animal e pedem para deixá-lo
          com a sua ONG, ou devolvem um pet que adotaram por aqui. O processo é
          parecido com o da adoção, no sentido contrário.
        </p>
      </Card>

      {active.length > 0 ? (
        renderList(active)
      ) : (
        <Card className="items-center gap-2 text-center">
          <p className="text-sm text-neutral-600">
            Nenhum pedido em andamento.
          </p>
        </Card>
      )}

      {finished.length > 0 ? (
        <>
          <h2 className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
            Encerrados
          </h2>
          {renderList(finished)}
        </>
      ) : null}

      <NgoTabBar />
    </PageShell>
  );
}
