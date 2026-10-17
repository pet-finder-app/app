import { promises as fs } from "node:fs";
import path from "node:path";
import type { Notification } from "./notification";

/** Notification persistence adapter, replaceable with backend delivery. */

const NOTIFICATIONS_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "notifications.json",
);

export async function readNotifications(): Promise<Notification[]> {
  const raw = await fs.readFile(NOTIFICATIONS_FILE, "utf-8");
  return (JSON.parse(raw) as { notifications: Notification[] }).notifications;
}

async function writeNotifications(
  notifications: Notification[],
): Promise<void> {
  await fs.writeFile(
    NOTIFICATIONS_FILE,
    JSON.stringify({ notifications }, null, 2) + "\n",
    "utf-8",
  );
}

export async function listNotificationsByNgo(
  ngoId: string,
): Promise<Notification[]> {
  const notifications = await readNotifications();
  return notifications
    .filter((n) => n.ngoId === ngoId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function countUnreadByNgo(ngoId: string): Promise<number> {
  const notifications = await listNotificationsByNgo(ngoId);
  return notifications.filter((n) => n.readAt === null).length;
}

/** Count each pet's like and interest notifications. */
export function countNotificationsByPet(
  notifications: Notification[],
  type: Notification["type"],
): Record<string, number> {
  return notifications.reduce<Record<string, number>>((acc, n) => {
    if (n.type === type) acc[n.petId] = (acc[n.petId] ?? 0) + 1;
    return acc;
  }, {});
}

export async function markAllReadByNgo(ngoId: string): Promise<void> {
  const notifications = await readNotifications();
  const now = new Date().toISOString();
  await writeNotifications(
    notifications.map((n) =>
      n.ngoId === ngoId && n.readAt === null ? { ...n, readAt: now } : n,
    ),
  );
}

/** The adopter's own like and interest activity. */
export async function listNotificationsByAdopter(
  adopterId: string,
): Promise<Notification[]> {
  const notifications = await readNotifications();
  return notifications
    .filter((n) => n.adopterId === adopterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

type LikeInput = {
  ngoId: string;
  petId: string;
  petName: string;
  adopterId: string;
  adopterName: string;
  adopterAvatarUrl: string | null;
};

/** Likes toggle: liking an already-liked pet removes its notification. Interest messages are individual submissions and remain recorded. */
export async function toggleLike(
  input: LikeInput,
  desiredLiked?: boolean,
): Promise<{ liked: boolean }> {
  const notifications = await readNotifications();
  const index = notifications.findIndex(
    (n) =>
      n.type === "like" &&
      n.petId === input.petId &&
      n.adopterId === input.adopterId,
  );

  if (desiredLiked !== undefined && desiredLiked === (index !== -1)) {
    return { liked: desiredLiked };
  }

  if (index !== -1) {
    notifications.splice(index, 1);
    await writeNotifications(notifications);
    return { liked: false };
  }

  const notification: Notification = {
    id: crypto.randomUUID(),
    ngoId: input.ngoId,
    petId: input.petId,
    petName: input.petName,
    adopterId: input.adopterId,
    adopterName: input.adopterName,
    adopterAvatarUrl: input.adopterAvatarUrl,
    type: "like",
    message: "",
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  await writeNotifications([...notifications, notification]);
  return { liked: true };
}

type InterestInput = LikeInput & { message: string };

export async function createInterest(
  input: InterestInput,
): Promise<Notification> {
  const notifications = await readNotifications();
  const notification: Notification = {
    id: crypto.randomUUID(),
    ngoId: input.ngoId,
    petId: input.petId,
    petName: input.petName,
    adopterId: input.adopterId,
    adopterName: input.adopterName,
    adopterAvatarUrl: input.adopterAvatarUrl,
    type: "interest",
    message: input.message,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  await writeNotifications([...notifications, notification]);
  return notification;
}

/** Remove notifications involving the deleted user as NGO or adopter. */
export async function deleteNotificationsOfUser(userId: string): Promise<void> {
  const notifications = await readNotifications();
  await writeNotifications(
    notifications.filter((n) => n.ngoId !== userId && n.adopterId !== userId),
  );
}
