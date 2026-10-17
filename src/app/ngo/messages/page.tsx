import { ConversationList } from "@/components/conversations/conversation-list";
import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { Card, CardTitle, LinkButton, PageShell } from "@/components/ui";
import { countUnreadFor } from "@/lib/conversation";
import { listConversationsByNgo } from "@/lib/conversations";
import { countUnreadByNgo } from "@/lib/notifications";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mensagens – Petfinder",
};

/** NGO conversations with adopters, optionally filtered by pet query parameter. */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const { pet: petId } = await searchParams;
  const [unreadCount, all] = await Promise.all([
    countUnreadByNgo(user.id),
    listConversationsByNgo(user.id),
  ]);
  const unreadMessages = all.reduce(
    (sum, c) => sum + countUnreadFor(c, "ngo"),
    0,
  );
  const conversations = petId ? all.filter((c) => c.petId === petId) : all;

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <CardTitle>
          {petId && conversations[0]
            ? `Conversas sobre ${conversations[0].petName}`
            : "Mensagens"}
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Conversas com quem quer adotar seus pets.
        </p>
        <LinkButton
          href="/ngo/adoptions"
          variant="outline"
          size="sm"
          className="self-start"
        >
          Ver adoções em andamento
        </LinkButton>
        {petId ? (
          <LinkButton
            href="/ngo/messages"
            variant="pill"
            size="sm"
            className="self-start"
          >
            Ver todas
          </LinkButton>
        ) : null}
      </Card>

      <ConversationList
        conversations={conversations}
        role="ngo"
        basePath="/ngo/conversations"
        otherName={(c) => c.adopterName}
        emptyText="Nenhuma conversa ainda. Quando alguém tocar em “Quero adotar” num dos seus pets, a conversa aparece aqui."
      />

      <NgoTabBar
        unreadCount={unreadCount}
        unreadMessageCount={unreadMessages}
      />
    </PageShell>
  );
}
