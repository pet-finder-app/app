import { ConversationList } from "@/components/conversation-list";
import { OngTabBar } from "@/components/ong-tab-bar";
import { Card, CardTitle, LinkButton, PageShell } from "@/components/ui";
import { countUnreadFor } from "@/lib/conversation";
import { listConversationsByOng } from "@/lib/conversations";
import { countUnreadByOng } from "@/lib/notifications";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mensagens – Petfinder",
};

/** Conversas da ONG com os adotantes. `?pet=<id>` filtra pelas de um pet. */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const { pet: petId } = await searchParams;
  const [unreadCount, all] = await Promise.all([
    countUnreadByOng(user.id),
    listConversationsByOng(user.id),
  ]);
  const unreadMessages = all.reduce(
    (sum, c) => sum + countUnreadFor(c, "ong"),
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
          href="/ong/adocoes"
          variant="outline"
          size="sm"
          className="self-start"
        >
          Ver adoções em andamento
        </LinkButton>
        {petId ? (
          <LinkButton
            href="/ong/mensagens"
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
        role="ong"
        basePath="/ong/conversas"
        otherName={(c) => c.adopterName}
        emptyText="Nenhuma conversa ainda. Quando alguém tocar em “Quero adotar” num dos seus pets, a conversa aparece aqui."
      />

      <OngTabBar
        unreadCount={unreadCount}
        unreadMessageCount={unreadMessages}
      />
    </PageShell>
  );
}
