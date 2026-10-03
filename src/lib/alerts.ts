import { isAdoptionActive, whoActsNow, type Adoption } from "./adoption";
import { listAdoptionsByAdopter, listAdoptionsByOng } from "./adoptions";
import { countUnreadFor, type ChatRole } from "./conversation";
import {
  listConversationsByAdopter,
  listConversationsByOng,
} from "./conversations";

/**
 * Avisos de "tem algo para você": mensagens não lidas e adoções em que é a
 * vez da pessoa. Alimentam o selo do menu de baixo e o aviso no Início.
 */

export type Alerts = {
  /** Mensagens não lidas, somando as conversas. */
  chats: number;
  /** Adoções em andamento em que é a vez da pessoa agir. */
  adoptionsToAct: Adoption[];
};

export async function getAlerts(
  userId: string,
  role: ChatRole,
): Promise<Alerts> {
  const [conversations, adoptions] = await Promise.all([
    role === "adopter"
      ? listConversationsByAdopter(userId)
      : listConversationsByOng(userId),
    role === "adopter"
      ? listAdoptionsByAdopter(userId)
      : listAdoptionsByOng(userId),
  ]);
  return {
    chats: conversations.reduce((sum, c) => sum + countUnreadFor(c, role), 0),
    adoptionsToAct: adoptions.filter(
      (a) => isAdoptionActive(a.status) && whoActsNow(a) === role,
    ),
  };
}
