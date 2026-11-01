import { AdoptionPanel } from "@/components/adoptions/adoption-panel";
import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
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

export default async function NgoAdoptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const adoption = await getAdoptionById(id);
  if (!adoption || adoption.ngoId !== user.id) notFound();

  return (
    <PageShell hasActionBar>
      <LinkButton
        href="/ngo/adoptions"
        variant="pill"
        size="sm"
        className="self-start"
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Adoções
      </LinkButton>
      <AdoptionPanel
        initialAdoption={toClientAdoption(adoption)}
        role="ngo"
        chatHref={
          adoption.conversationId
            ? `/ngo/conversations/${adoption.conversationId}`
            : "/ngo/messages"
        }
      />
      <NgoTabBar />
    </PageShell>
  );
}
