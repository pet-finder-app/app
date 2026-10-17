import { isAdoptionActive, whoActsNow, type Adoption } from "./adoption";
import { listAdoptionsByAdopter, listAdoptionsByNgo } from "./adoptions";
import { countUnreadFor, type ChatRole } from "./conversation";
import {
  listConversationsByAdopter,
  listConversationsByNgo,
} from "./conversations";

/** Unread-message and pending-adoption-action counts for navigation badges and the home notice. */

export type Alerts = {
  /** Unread messages across all conversations. */
  chats: number;
  /** Active adoptions requiring the current participant's action. */
  adoptionsToAct: Adoption[];
};

export async function getAlerts(
  userId: string,
  role: ChatRole,
): Promise<Alerts> {
  const [conversations, adoptions] = await Promise.all([
    role === "adopter"
      ? listConversationsByAdopter(userId)
      : listConversationsByNgo(userId),
    role === "adopter"
      ? listAdoptionsByAdopter(userId)
      : listAdoptionsByNgo(userId),
  ]);
  return {
    chats: conversations.reduce((sum, c) => sum + countUnreadFor(c, role), 0),
    adoptionsToAct: adoptions.filter(
      (a) => isAdoptionActive(a.status) && whoActsNow(a) === role,
    ),
  };
}
