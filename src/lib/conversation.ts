/** Client-safe conversation model: one conversation per pet/adopter, persisted in conversations.json. */

export type ChatMessage = {
  id: string;
  /** Identifier of the message author. */
  senderId: string;
  text: string;
  /** System messages are automatic workflow notices with senderId set to system. */
  kind?: "system";
  /** ISO timestamp. */
  createdAt: string;
};

export type ChatRole = "adopter" | "ngo";

export type Conversation = {
  id: string;
  petId: string;
  petName: string;
  ngoId: string;
  adopterId: string;
  adopterName: string;
  /** Surrender conversation rather than a published-pet conversation. The pet identifier is request-specific and the name identifies the incoming pet. */
  surrenderId?: string;
  messages: ChatMessage[];
  /** Latest timestamp read by each participant. */
  lastReadAt: Record<ChatRole, string | null>;
  createdAt: string;
  updatedAt: string;
};

export const MAX_MESSAGE_LENGTH = 2000;

/** Other participant's messages not yet read by the current viewer. */
export function countUnreadFor(
  conversation: Conversation,
  role: ChatRole,
): number {
  const myId = role === "adopter" ? conversation.adopterId : conversation.ngoId;
  const readAt = conversation.lastReadAt[role];
  return conversation.messages.filter(
    (m) => m.senderId !== myId && (readAt === null || m.createdAt > readAt),
  ).length;
}

/** Format message time as today's clock time, yesterday, or an older calendar date. */
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
