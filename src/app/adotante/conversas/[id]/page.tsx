import { ChatThread } from "@/components/chat-thread";
import { Card, iconSize, LinkButton, PageShell } from "@/components/ui";
import { adopterNextActionLabel, adoptionStageLabel } from "@/lib/adoption";
import { findAdoptionByPetAndAdopter } from "@/lib/adoptions";
import { getConversationById, markConversationRead } from "@/lib/conversations";
import { getOngInfoMap } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Conversa – Petfinder",
};

export default async function AdopterChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const conversation = await getConversationById(id);
  if (!conversation || conversation.adopterId !== user.id) notFound();

  await markConversationRead(id, "adopter");
  const ong = (await getOngInfoMap()).get(conversation.ongId);
  const ongName = ong?.name ?? "ONG";
  const surrenderId = conversation.surrenderId;
  const adoption = surrenderId
    ? undefined
    : await findAdoptionByPetAndAdopter(conversation.petId, user.id);

  return (
    <PageShell hasActionBar className="pb-28">
      <Card as="header" className="gap-2">
        <LinkButton
          href="/adotante/conversas"
          variant="pill"
          size="sm"
          className="self-start"
        >
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Conversas
        </LinkButton>
        <h1 className="text-lg font-bold text-neutral-900">{ongName}</h1>
        <p className="text-sm text-neutral-600">
          {surrenderId ? "Entrega de " : "Sobre "}
          <Link
            href={
              surrenderId
                ? `/adotante/acolhimentos/${surrenderId}`
                : `/pets/${conversation.petId}`
            }
            className="font-bold text-neutral-900 underline"
          >
            {conversation.petName}
          </Link>
        </p>
        {adoption ? (
          <LinkButton
            href={`/adotante/adocoes/${adoption.id}`}
            size="sm"
            className="self-start"
          >
            {adopterNextActionLabel(adoption)
              ? `Sua vez: ${adopterNextActionLabel(adoption)}`
              : `Adoção: ${adoptionStageLabel(adoption)}`}
          </LinkButton>
        ) : null}
      </Card>

      <ChatThread
        conversationId={conversation.id}
        meId={user.id}
        otherName={ongName}
        initialMessages={conversation.messages}
      />
    </PageShell>
  );
}
