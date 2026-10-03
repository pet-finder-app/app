/**
 * Conversa entre um adotante e uma ONG sobre um pet (como o chat de anúncio
 * do OLX): uma conversa por pet + adotante. Fica em `conversations.json`.
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

export type ChatMessage = {
  id: string;
  /** `StoredUser.id` de quem escreveu. */
  senderId: string;
  text: string;
  /** "system" = aviso automático do processo de adoção (senderId "system"). */
  kind?: "system";
  /** ISO datetime. */
  createdAt: string;
};

export type ChatRole = "adopter" | "ong";

export type Conversation = {
  id: string;
  petId: string;
  petName: string;
  ongId: string;
  adopterId: string;
  adopterName: string;
  /**
   * Conversa sobre a entrega de um pet à ONG (ver `lib/surrender.ts`), e não
   * sobre um pet publicado. Nesse caso `petId` é só um identificador próprio
   * e `petName` é o animal que será entregue.
   */
  surrenderId?: string;
  messages: ChatMessage[];
  /** Até quando cada lado já leu (ISO datetime). */
  lastReadAt: Record<ChatRole, string | null>;
  createdAt: string;
  updatedAt: string;
};

export const MAX_MESSAGE_LENGTH = 2000;

/** Mensagens do outro lado que este lado ainda não leu. */
export function countUnreadFor(
  conversation: Conversation,
  role: ChatRole,
): number {
  const myId = role === "adopter" ? conversation.adopterId : conversation.ongId;
  const readAt = conversation.lastReadAt[role];
  return conversation.messages.filter(
    (m) => m.senderId !== myId && (readAt === null || m.createdAt > readAt),
  ).length;
}

/** "14:32" hoje, "ontem" ou "03/10" para mensagens mais antigas. */
export function formatChatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
