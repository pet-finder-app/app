import { promises as fs } from "node:fs";
import path from "node:path";
import type { ChatMessage, ChatRole, Conversation } from "./conversation";

/**
 * Camada de acesso às conversas — hoje um arquivo JSON, amanhã o backend com
 * chat em tempo real (hoje o client busca de tempos em tempos). Só este
 * arquivo precisa mudar (ver `lib/notifications.ts`).
 */

const FILE = path.join(process.cwd(), "src", "data", "conversations.json");

async function readConversations(): Promise<Conversation[]> {
  const raw = await fs.readFile(FILE, "utf-8");
  return (JSON.parse(raw) as { conversations: Conversation[] }).conversations;
}

async function writeConversations(
  conversations: Conversation[],
): Promise<void> {
  await fs.writeFile(
    FILE,
    JSON.stringify({ conversations }, null, 2) + "\n",
    "utf-8",
  );
}

const byRecent = (a: Conversation, b: Conversation) =>
  b.updatedAt.localeCompare(a.updatedAt);

export async function getConversationById(
  id: string,
): Promise<Conversation | undefined> {
  return (await readConversations()).find((c) => c.id === id);
}

export async function findConversation(
  petId: string,
  adopterId: string,
): Promise<Conversation | undefined> {
  return (await readConversations()).find(
    (c) => c.petId === petId && c.adopterId === adopterId,
  );
}

export async function listConversationsByAdopter(
  adopterId: string,
): Promise<Conversation[]> {
  return (await readConversations())
    .filter((c) => c.adopterId === adopterId)
    .sort(byRecent);
}

export async function listConversationsByOng(
  ongId: string,
): Promise<Conversation[]> {
  return (await readConversations())
    .filter((c) => c.ongId === ongId)
    .sort(byRecent);
}

/** O adotante escreve sobre um pet: abre a conversa se ainda não existir. */
export async function startOrAppendConversation(input: {
  petId: string;
  petName: string;
  ongId: string;
  adopterId: string;
  adopterName: string;
  text: string;
}): Promise<Conversation> {
  const conversations = await readConversations();
  const now = new Date().toISOString();
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    senderId: input.adopterId,
    text: input.text,
    createdAt: now,
  };

  const index = conversations.findIndex(
    (c) => c.petId === input.petId && c.adopterId === input.adopterId,
  );
  if (index === -1) {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      petId: input.petId,
      petName: input.petName,
      ongId: input.ongId,
      adopterId: input.adopterId,
      adopterName: input.adopterName,
      messages: [message],
      lastReadAt: { adopter: now, ong: null },
      createdAt: now,
      updatedAt: now,
    };
    await writeConversations([...conversations, conversation]);
    return conversation;
  }

  const updated: Conversation = {
    ...conversations[index],
    messages: [...conversations[index].messages, message],
    lastReadAt: { ...conversations[index].lastReadAt, adopter: now },
    updatedAt: now,
  };
  conversations[index] = updated;
  await writeConversations(conversations);
  return updated;
}

/**
 * A ONG puxa assunto com um interessado que ainda não escreveu. Se a conversa
 * desse pet com esse adotante já existe, só devolve ela.
 */
export async function startConversationByOng(input: {
  petId: string;
  petName: string;
  ongId: string;
  adopterId: string;
  adopterName: string;
  text: string;
}): Promise<Conversation> {
  const conversations = await readConversations();
  const existing = conversations.find(
    (c) => c.petId === input.petId && c.adopterId === input.adopterId,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    petId: input.petId,
    petName: input.petName,
    ongId: input.ongId,
    adopterId: input.adopterId,
    adopterName: input.adopterName,
    messages: [
      {
        id: crypto.randomUUID(),
        senderId: input.ongId,
        text: input.text,
        createdAt: now,
      },
    ],
    lastReadAt: { adopter: null, ong: now },
    createdAt: now,
    updatedAt: now,
  };
  await writeConversations([...conversations, conversation]);
  return conversation;
}

/** Abre a conversa de um pedido de entrega de pet à ONG (uma por pedido). */
export async function createSurrenderConversation(input: {
  surrenderId: string;
  petName: string;
  ongId: string;
  adopterId: string;
  adopterName: string;
}): Promise<Conversation> {
  const conversations = await readConversations();
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    petId: `acolhimento-${input.surrenderId}`,
    petName: input.petName,
    ongId: input.ongId,
    adopterId: input.adopterId,
    adopterName: input.adopterName,
    surrenderId: input.surrenderId,
    messages: [],
    lastReadAt: { adopter: now, ong: null },
    createdAt: now,
    updatedAt: now,
  };
  await writeConversations([...conversations, conversation]);
  return conversation;
}

/** Acrescenta uma mensagem a uma conversa existente. */
export async function appendMessage(
  id: string,
  senderId: string,
  role: ChatRole,
  text: string,
): Promise<{ conversation: Conversation; message: ChatMessage } | undefined> {
  const conversations = await readConversations();
  const index = conversations.findIndex((c) => c.id === id);
  if (index === -1) return undefined;

  const now = new Date().toISOString();
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    senderId,
    text,
    createdAt: now,
  };
  const conversation: Conversation = {
    ...conversations[index],
    messages: [...conversations[index].messages, message],
    lastReadAt: { ...conversations[index].lastReadAt, [role]: now },
    updatedAt: now,
  };
  conversations[index] = conversation;
  await writeConversations(conversations);
  return { conversation, message };
}

/** Aviso automático (ex.: "A ONG enviou o termo"). Não muda quem leu até agora. */
export async function appendSystemMessage(
  id: string,
  text: string,
): Promise<void> {
  const conversations = await readConversations();
  const index = conversations.findIndex((c) => c.id === id);
  if (index === -1) return;
  const now = new Date().toISOString();
  conversations[index] = {
    ...conversations[index],
    messages: [
      ...conversations[index].messages,
      {
        id: crypto.randomUUID(),
        senderId: "system",
        text,
        kind: "system",
        createdAt: now,
      },
    ],
    updatedAt: now,
  };
  await writeConversations(conversations);
}

/** Marca como lido para um lado; só grava se havia algo novo. */
export async function markConversationRead(
  id: string,
  role: ChatRole,
): Promise<void> {
  const conversations = await readConversations();
  const index = conversations.findIndex((c) => c.id === id);
  if (index === -1) return;
  const last = conversations[index].messages.at(-1);
  const readAt = conversations[index].lastReadAt[role];
  if (!last || (readAt !== null && readAt >= last.createdAt)) return;
  conversations[index] = {
    ...conversations[index],
    lastReadAt: { ...conversations[index].lastReadAt, [role]: last.createdAt },
  };
  await writeConversations(conversations);
}
