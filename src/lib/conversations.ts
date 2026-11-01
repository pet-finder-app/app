import { promises as fs } from "node:fs";
import path from "node:path";
import type { ChatMessage, ChatRole, Conversation } from "./conversation";

/** Conversation persistence adapter using JSON and client polling until a real-time backend is available. */

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

export async function listConversationsByNgo(
  ngoId: string,
): Promise<Conversation[]> {
  return (await readConversations())
    .filter((c) => c.ngoId === ngoId)
    .sort(byRecent);
}

/** Open an adopter conversation about a pet if none exists. */
export async function startOrAppendConversation(input: {
  petId: string;
  petName: string;
  ngoId: string;
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
      ngoId: input.ngoId,
      adopterId: input.adopterId,
      adopterName: input.adopterName,
      messages: [message],
      lastReadAt: { adopter: now, ngo: null },
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

/** Start an NGO conversation with an interested adopter, reusing an existing conversation for that pet/adopter pair. */
export async function startConversationByNgo(input: {
  petId: string;
  petName: string;
  ngoId: string;
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
    ngoId: input.ngoId,
    adopterId: input.adopterId,
    adopterName: input.adopterName,
    messages: [
      {
        id: crypto.randomUUID(),
        senderId: input.ngoId,
        text: input.text,
        createdAt: now,
      },
    ],
    lastReadAt: { adopter: null, ngo: now },
    createdAt: now,
    updatedAt: now,
  };
  await writeConversations([...conversations, conversation]);
  return conversation;
}

/** Open one conversation per surrender request. */
export async function createSurrenderConversation(input: {
  surrenderId: string;
  petName: string;
  ngoId: string;
  adopterId: string;
  adopterName: string;
}): Promise<Conversation> {
  const conversations = await readConversations();
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    petId: `acolhimento-${input.surrenderId}`,
    petName: input.petName,
    ngoId: input.ngoId,
    adopterId: input.adopterId,
    adopterName: input.adopterName,
    surrenderId: input.surrenderId,
    messages: [],
    lastReadAt: { adopter: now, ngo: null },
    createdAt: now,
    updatedAt: now,
  };
  await writeConversations([...conversations, conversation]);
  return conversation;
}

/** Append a message to an existing conversation. */
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

/** Append an automatic workflow notice without advancing either read marker. */
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

/** Advance a participant's read marker only when new messages exist. */
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
