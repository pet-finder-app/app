import { ChatThread } from "@/components/chat-thread";
import { StartAdoptionButton } from "@/components/start-adoption-button";
import { Card, iconSize, LinkButton, PageShell } from "@/components/ui";
import { isAdoptionActive } from "@/lib/adoption";
import { listAdoptionsByOng } from "@/lib/adoptions";
import { getConversationById, markConversationRead } from "@/lib/conversations";
import { getPetById } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Conversa – Petfinder",
};

export default async function OngChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const conversation = await getConversationById(id);
  if (!conversation || conversation.ongId !== user.id) notFound();

  await markConversationRead(id, "ong");

  const [adoptions, pet] = await Promise.all([
    listAdoptionsByOng(user.id),
    getPetById(conversation.petId),
  ]);
  const adoption = adoptions.find(
    (a) =>
      a.petId === conversation.petId && a.adopterId === conversation.adopterId,
  );
  const petBusyWithOther = adoptions.some(
    (a) =>
      a.petId === conversation.petId &&
      a.adopterId !== conversation.adopterId &&
      isAdoptionActive(a.status),
  );
  const surrenderId = conversation.surrenderId;
  const canStart =
    !surrenderId &&
    user.ong.verification.status === "verificada" &&
    pet?.status !== "adotado" &&
    !petBusyWithOther &&
    (!adoption || !isAdoptionActive(adoption.status));

  return (
    <PageShell hasActionBar className="pb-28">
      <Card as="header" className="gap-2">
        <LinkButton
          href="/ong/mensagens"
          variant="pill"
          size="sm"
          className="self-start"
        >
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Mensagens
        </LinkButton>
        <h1 className="text-lg font-bold text-neutral-900">
          {conversation.adopterName}
        </h1>
        <p className="text-sm text-neutral-600">
          {surrenderId ? "Quer deixar " : "Quer adotar "}
          <span className="font-bold text-neutral-900">
            {conversation.petName}
          </span>
          {surrenderId ? " com a ONG" : null}
        </p>
        {surrenderId ? (
          <LinkButton
            href={`/ong/acolhimentos/${surrenderId}`}
            size="sm"
            className="self-start"
          >
            Ver pedido de acolhimento
          </LinkButton>
        ) : adoption && isAdoptionActive(adoption.status) ? (
          <LinkButton
            href={`/ong/adocoes/${adoption.id}`}
            size="sm"
            className="self-start"
          >
            Ver adoção em andamento
          </LinkButton>
        ) : canStart ? (
          <StartAdoptionButton conversationId={conversation.id} />
        ) : petBusyWithOther ? (
          <p className="text-xs text-neutral-600">
            {conversation.petName} já está em processo de adoção com outra
            pessoa.
          </p>
        ) : null}
      </Card>

      <ChatThread
        conversationId={conversation.id}
        meId={user.id}
        otherName={conversation.adopterName}
        initialMessages={conversation.messages}
      />
    </PageShell>
  );
}
