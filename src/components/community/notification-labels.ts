import type { NotificationResponse } from "@/lib/backend/contracts";

/** Notification kinds written by Go database triggers and handlers. */
export const NOTIFICATION_KINDS = [
  "message",
  "application",
  "post",
  "appointment",
  "surrender",
  "donation",
  "followup",
  "followup_due",
  "verification",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_LABELS: Record<NotificationKind, string> = {
  message: "Nova mensagem em uma conversa",
  application: "Atualização em um pedido de adoção",
  post: "Nova publicação de uma ONG que você segue",
  appointment: "Agendamento criado ou alterado",
  surrender: "Atualização em uma solicitação de entrega",
  donation: "Atualização em uma doação",
  followup: "Atualização no acompanhamento pós-adoção",
  followup_due: "Relato de acompanhamento pendente",
  verification: "Resultado de uma verificação",
};

export const isNotificationKind = (kind: string): kind is NotificationKind =>
  (NOTIFICATION_KINDS as readonly string[]).includes(kind);

/** Label for any kind; kinds newer than this app get a generic text. */
export const notificationLabel = (kind: string) =>
  isNotificationKind(kind) ? NOTIFICATION_LABELS[kind] : "Nova notificação";

export type NotificationTarget = Pick<
  NotificationResponse,
  "kind" | "subjectId" | "applicationId" | "audience"
>;

const segment = encodeURIComponent;

/** `/adopter/...` for the requester side of a case, `/ngo/...` for members. */
const sidePath = (audience: NotificationTarget["audience"], path: string) =>
  `${audience === "organization" ? "/ngo" : "/adopter"}/${path}`;

const adoptionPath = ({ applicationId, audience }: NotificationTarget) =>
  applicationId
    ? sidePath(audience, `adoptions/${segment(applicationId)}`)
    : null;

const followUpPath = ({ applicationId, subjectId }: NotificationTarget) =>
  applicationId
    ? `/adoptions/${segment(applicationId)}/follow-ups/${segment(subjectId)}`
    : null;

/** One resolver per kind: adding a kind without a page fails type checks. */
const RESOLVERS: Record<
  NotificationKind,
  (target: NotificationTarget) => string | null
> = {
  message: (n) => sidePath(n.audience, `conversations/${segment(n.subjectId)}`),
  // The subject is the application itself, so it backs up a missing id.
  application: (n) =>
    adoptionPath({ ...n, applicationId: n.applicationId ?? n.subjectId }),
  appointment: adoptionPath,
  followup: followUpPath,
  followup_due: followUpPath,
  donation: (n) =>
    n.audience === "organization"
      ? `/ngo/donations/${segment(n.subjectId)}`
      : `/adopter/donate/history/${segment(n.subjectId)}`,
  surrender: (n) => sidePath(n.audience, `surrenders/${segment(n.subjectId)}`),
  post: (n) => `/feed/posts/${segment(n.subjectId)}`,
  // Go addresses verification results to the person who submitted them.
  verification: () => "/me",
};

/** Where a notification's subject can be opened, or null when no page fits. */
export function notificationHref(target: NotificationTarget): string | null {
  return isNotificationKind(target.kind)
    ? RESOLVERS[target.kind](target)
    : null;
}
