import { OngTabBar } from "@/components/ong-tab-bar";
import { SurrenderPanel } from "@/components/surrender-panel";
import { iconSize, LinkButton, PageShell } from "@/components/ui";
import { toClientSurrender } from "@/lib/surrender";
import { getSurrenderById } from "@/lib/surrenders";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pedido de acolhimento – Petfinder",
};

export default async function OngSurrenderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const surrender = await getSurrenderById(id);
  if (!surrender || surrender.ongId !== user.id) notFound();

  const { shelterCapacity, currentAnimals } = user.ong.operations;
  const shelterNote =
    shelterCapacity !== null && currentAnimals !== null
      ? `Pelo seu cadastro, o abrigo tem ${currentAnimals} de ${shelterCapacity} vagas ocupadas.`
      : null;

  return (
    <PageShell hasActionBar>
      <LinkButton
        href="/ong/acolhimentos"
        variant="pill"
        size="sm"
        className="self-start"
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Pedidos de acolhimento
      </LinkButton>
      <SurrenderPanel
        initialSurrender={toClientSurrender(surrender)}
        role="ong"
        shelterNote={shelterNote}
        chatHref={
          surrender.conversationId
            ? `/ong/conversas/${surrender.conversationId}`
            : "/ong/mensagens"
        }
      />
      <OngTabBar />
    </PageShell>
  );
}
