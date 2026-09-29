/**
 * Notificações que a ONG recebe sobre os pets publicados. Vem de ações do
 * adotante — hoje simuladas em `notifications.json`, até o lado do adotante
 * existir de verdade.
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

export type NotificationType = "curtida" | "interesse";

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  // Curtiu o pet, mas ainda não deu o próximo passo.
  curtida: "curtiu",
  // Demonstrou interesse real em adotar (mensagem, formulário etc.).
  interesse: "tem interesse em adotar",
};

export type Notification = {
  id: string;
  ongId: string;
  petId: string;
  petName: string;
  /** `StoredUser.id` do adotante que curtiu ou demonstrou interesse. */
  adopterId: string;
  adopterName: string;
  adopterAvatarUrl: string | null;
  type: NotificationType;
  /** Mensagem do adotante, quando houver (só em "interesse"). */
  message: string;
  /** ISO datetime. */
  createdAt: string;
  /** ISO datetime, ou null enquanto não lida. */
  readAt: string | null;
};
