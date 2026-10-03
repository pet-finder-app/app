import { AdopterTabBar } from "@/components/adopter-tab-bar";
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
  title: "Entrega do pet – Petfinder",
};

export default async function AdopterSurrenderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const surrender = await getSurrenderById(id);
  if (!surrender || surrender.adopterId !== user.id) notFound();

  return (
    <PageShell hasActionBar>
      <LinkButton
        href="/adotante/notificacoes"
        variant="pill"
        size="sm"
        className="self-start"
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Atividade
      </LinkButton>
      <SurrenderPanel
        initialSurrender={toClientSurrender(surrender)}
        role="adopter"
        chatHref={
          surrender.conversationId
            ? `/adotante/conversas/${surrender.conversationId}`
            : "/adotante/conversas"
        }
      />
      <AdopterTabBar />
    </PageShell>
  );
}
