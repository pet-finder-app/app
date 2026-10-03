import { OngTabBar } from "@/components/ong-tab-bar";
import { StartConversationButton } from "@/components/start-conversation-button";
import {
  Badge,
  Card,
  CardTitle,
  iconSize,
  LinkButton,
  PageShell,
} from "@/components/ui";
import { countUnreadFor } from "@/lib/conversation";
import { listConversationsByOng } from "@/lib/conversations";
import { countUnreadByOng, listNotificationsByOng } from "@/lib/notifications";
import { getPetByIdAndOng } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Interessados – Petfinder",
};

/** Quem curtiu ou quer adotar um pet da ONG, com atalho para conversar. */
export default async function PetInterestedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const pet = await getPetByIdAndOng(id, user.id);
  if (!pet) notFound();

  const [notifications, conversations, unreadCount] = await Promise.all([
    listNotificationsByOng(user.id),
    listConversationsByOng(user.id),
    countUnreadByOng(user.id),
  ]);
  const unreadMessages = conversations.reduce(
    (sum, c) => sum + countUnreadFor(c, "ong"),
    0,
  );

  // Uma linha por pessoa: "quer adotar" vale mais que só curtir.
  const people = new Map<
    string,
    { adopterId: string; name: string; wantsToAdopt: boolean }
  >();
  for (const n of notifications.filter((n) => n.petId === pet.id)) {
    const current = people.get(n.adopterId);
    people.set(n.adopterId, {
      adopterId: n.adopterId,
      name: n.adopterName,
      wantsToAdopt: Boolean(current?.wantsToAdopt) || n.type === "interesse",
    });
  }
  const list = [...people.values()].sort(
    (a, b) => Number(b.wantsToAdopt) - Number(a.wantsToAdopt),
  );
  const conversationByAdopter = new Map(
    conversations
      .filter((c) => c.petId === pet.id)
      .map((c) => [c.adopterId, c.id]),
  );

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <LinkButton
          href="/ong/pets"
          variant="pill"
          size="sm"
          className="self-start"
        >
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Meus pets
        </LinkButton>
        <CardTitle>Interessados em {pet.name}</CardTitle>
        <p className="text-sm text-neutral-600">
          Quem curtiu ou pediu para adotar. Puxe assunto com quem ainda não
          escreveu.
        </p>
      </Card>

      {list.length === 0 ? (
        <Card className="items-center text-center">
          <p className="text-sm text-neutral-600">
            Ninguém demonstrou interesse em {pet.name} ainda.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((person) => {
            const conversationId = conversationByAdopter.get(person.adopterId);
            return (
              <li key={person.adopterId}>
                <Card className="flex-row items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-neutral-900">
                      {person.name}
                    </p>
                    <Badge
                      tone={person.wantsToAdopt ? "success" : "neutral"}
                      size="sm"
                    >
                      {person.wantsToAdopt ? "Quer adotar" : "Curtiu"}
                    </Badge>
                  </div>
                  {conversationId ? (
                    <LinkButton
                      href={`/ong/conversas/${conversationId}`}
                      size="sm"
                      variant="pill"
                    >
                      Abrir conversa
                    </LinkButton>
                  ) : (
                    <StartConversationButton
                      petId={pet.id}
                      adopterId={person.adopterId}
                      adopterName={person.name}
                    />
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <OngTabBar
        unreadCount={unreadCount}
        unreadMessageCount={unreadMessages}
      />
    </PageShell>
  );
}
