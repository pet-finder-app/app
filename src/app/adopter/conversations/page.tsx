import { AdopterTabBar } from "@/components/adopter/adopter-tab-bar";
import { ConversationList } from "@/components/conversations/conversation-list";
import { Card, CardTitle, PageShell } from "@/components/ui";
import {
  findConversation,
  listConversationsByAdopter,
} from "@/lib/conversations";
import { getNgoInfoMap } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Conversas – Petfinder",
};

export default async function AdopterConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  // Open the existing conversation for the pet query parameter, when available.
  const { pet: petId } = await searchParams;
  if (petId) {
    const existing = await findConversation(petId, user.id);
    if (existing) redirect(`/adopter/conversations/${existing.id}`);
  }

  const [conversations, ngoInfo] = await Promise.all([
    listConversationsByAdopter(user.id),
    getNgoInfoMap(),
  ]);

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <CardTitle>Conversas</CardTitle>
        <p className="text-sm text-neutral-600">
          Suas conversas com as ONGs sobre cada pet.
        </p>
      </Card>

      <ConversationList
        conversations={conversations}
        role="adopter"
        basePath="/adopter/conversations"
        otherName={(c) => ngoInfo.get(c.ngoId)?.name ?? "ONG"}
        emptyText="Nenhuma conversa ainda. Toque em “Quero adotar” num pet para falar com a ONG."
      />

      <AdopterTabBar />
    </PageShell>
  );
}
