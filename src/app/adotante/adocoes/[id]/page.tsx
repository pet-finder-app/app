import { AdopterTabBar } from "@/components/adopter-tab-bar";
import { AdoptionPanel } from "@/components/adoption-panel";
import { iconSize, LinkButton, PageShell } from "@/components/ui";
import { toClientAdoption } from "@/lib/adoption";
import { getAdoptionById } from "@/lib/adoptions";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Minha adoção – Petfinder",
};

export default async function AdopterAdoptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const adoption = await getAdoptionById(id);
  if (!adoption || adoption.adopterId !== user.id) notFound();

  return (
    <PageShell hasActionBar>
      <LinkButton
        href="/adotante/conversas"
        variant="pill"
        size="sm"
        className="self-start"
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Conversas
      </LinkButton>
      <AdoptionPanel
        initialAdoption={toClientAdoption(adoption)}
        role="adopter"
        chatHref={
          adoption.conversationId
            ? `/adotante/conversas/${adoption.conversationId}`
            : "/adotante/conversas"
        }
      />
      <AdopterTabBar />
    </PageShell>
  );
}
