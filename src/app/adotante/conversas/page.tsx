import { AdopterTabBar } from "@/components/adopter-tab-bar";
import { ConversationList } from "@/components/conversation-list";
import { Card, CardTitle, PageShell } from "@/components/ui";
import {
  findConversation,
  listConversationsByAdopter,
} from "@/lib/conversations";
import { getOngInfoMap } from "@/lib/pets";
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

  // `?pet=<id>` abre direto a conversa daquele pet, se já existir.
  const { pet: petId } = await searchParams;
  if (petId) {
    const existing = await findConversation(petId, user.id);
    if (existing) redirect(`/adotante/conversas/${existing.id}`);
  }

  const [conversations, ongInfo] = await Promise.all([
    listConversationsByAdopter(user.id),
    getOngInfoMap(),
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
        basePath="/adotante/conversas"
        otherName={(c) => ongInfo.get(c.ongId)?.name ?? "ONG"}
        emptyText="Nenhuma conversa ainda. Toque em “Quero adotar” num pet para falar com a ONG."
      />

      <AdopterTabBar />
    </PageShell>
  );
}
