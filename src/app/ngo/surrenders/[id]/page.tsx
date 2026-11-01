import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { SurrenderPanel } from "@/components/surrenders/surrender-panel";
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

export default async function NgoSurrenderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const surrender = await getSurrenderById(id);
  if (!surrender || surrender.ngoId !== user.id) notFound();

  const { shelterCapacity, currentAnimals } = user.ngo.operations;
  const shelterNote =
    shelterCapacity !== null && currentAnimals !== null
      ? `Pelo seu cadastro, o abrigo tem ${currentAnimals} de ${shelterCapacity} vagas ocupadas.`
      : null;

  return (
    <PageShell hasActionBar>
      <LinkButton
        href="/ngo/surrenders"
        variant="pill"
        size="sm"
        className="self-start"
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Pedidos de acolhimento
      </LinkButton>
      <SurrenderPanel
        initialSurrender={toClientSurrender(surrender)}
        role="ngo"
        shelterNote={shelterNote}
        chatHref={
          surrender.conversationId
            ? `/ngo/conversations/${surrender.conversationId}`
            : "/ngo/messages"
        }
      />
      <NgoTabBar />
    </PageShell>
  );
}
