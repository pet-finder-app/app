/** Client-safe notifications from adopter interactions with published pets, persisted in notifications.json. */

export type NotificationType = "like" | "interest";

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  // Liked the pet without sending an adoption-interest message.
  like: "favoritou",
  // Expressed concrete adoption interest through a message or form.
  interest: "tem interesse em adotar",
};

export type Notification = {
  id: string;
  ngoId: string;
  petId: string;
  petName: string;
  /** Identifier of the adopter who liked the pet or expressed interest. */
  adopterId: string;
  adopterName: string;
  adopterAvatarUrl: string | null;
  type: NotificationType;
  /** Optional adopter message for interest notifications. */
  message: string;
  /** ISO timestamp. */
  createdAt: string;
  /** ISO read timestamp, or null until read. */
  readAt: string | null;
};
