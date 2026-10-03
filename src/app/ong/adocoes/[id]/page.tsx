import { AdoptionPanel } from "@/components/adoption-panel";
import { OngTabBar } from "@/components/ong-tab-bar";
import { iconSize, LinkButton, PageShell } from "@/components/ui";
import { toClientAdoption } from "@/lib/adoption";
import { getAdoptionById } from "@/lib/adoptions";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Adoção – Petfinder",
};

export default async function OngAdoptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const adoption = await getAdoptionById(id);
  if (!adoption || adoption.ongId !== user.id) notFound();

  return (
    <PageShell hasActionBar>
      <LinkButton
        href="/ong/adocoes"
        variant="pill"
        size="sm"
        className="self-start"
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Adoções
      </LinkButton>
      <AdoptionPanel
        initialAdoption={toClientAdoption(adoption)}
        role="ong"
        chatHref={
          adoption.conversationId
            ? `/ong/conversas/${adoption.conversationId}`
            : "/ong/mensagens"
        }
      />
      <OngTabBar />
    </PageShell>
  );
}
