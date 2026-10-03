import { promises as fs } from "node:fs";
import path from "node:path";
import type { Notification } from "./notification";

/**
 * Camada de acesso às notificações — hoje um arquivo JSON, amanhã o
 * backend (que vai empurrar essas notificações em tempo real).
 */

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

export async function listNotificationsByOng(
  ongId: string,
): Promise<Notification[]> {
  const notifications = await readNotifications();
  return notifications
    .filter((n) => n.ongId === ongId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function countUnreadByOng(ongId: string): Promise<number> {
  const notifications = await listNotificationsByOng(ongId);
  return notifications.filter((n) => n.readAt === null).length;
}

/** Quantas notificações de um tipo (curtida/interesse) cada pet recebeu. */
export function countNotificationsByPet(
  notifications: Notification[],
  type: Notification["type"],
): Record<string, number> {
  return notifications.reduce<Record<string, number>>((acc, n) => {
    if (n.type === type) acc[n.petId] = (acc[n.petId] ?? 0) + 1;
    return acc;
  }, {});
}

export async function markAllReadByOng(ongId: string): Promise<void> {
  const notifications = await readNotifications();
  const now = new Date().toISOString();
  await writeNotifications(
    notifications.map((n) =>
      n.ongId === ongId && n.readAt === null ? { ...n, readAt: now } : n,
    ),
  );
}

/** Atividade do próprio adotante: o que ele curtiu ou demonstrou interesse. */
export async function listNotificationsByAdopter(
  adopterId: string,
): Promise<Notification[]> {
  const notifications = await readNotifications();
  return notifications
    .filter((n) => n.adopterId === adopterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

type CurtidaInput = {
  ongId: string;
  petId: string;
  petName: string;
  adopterId: string;
  adopterName: string;
  adopterAvatarUrl: string | null;
};

/**
 * Curtir é um alternador: curtir de novo o mesmo pet descurtida (remove a
 * notificação). Diferente de "interesse", que é uma mensagem — cada envio
 * fica registrado.
 */
export async function toggleCurtida(
  input: CurtidaInput,
): Promise<{ liked: boolean }> {
  const notifications = await readNotifications();
  const index = notifications.findIndex(
    (n) =>
      n.type === "curtida" &&
      n.petId === input.petId &&
      n.adopterId === input.adopterId,
  );

  if (index !== -1) {
    notifications.splice(index, 1);
    await writeNotifications(notifications);
    return { liked: false };
  }

  const notification: Notification = {
    id: crypto.randomUUID(),
    ongId: input.ongId,
    petId: input.petId,
    petName: input.petName,
    adopterId: input.adopterId,
    adopterName: input.adopterName,
    adopterAvatarUrl: input.adopterAvatarUrl,
    type: "curtida",
    message: "",
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  await writeNotifications([...notifications, notification]);
  return { liked: true };
}

type InteresseInput = CurtidaInput & { message: string };

export async function createInteresse(
  input: InteresseInput,
): Promise<Notification> {
  const notifications = await readNotifications();
  const notification: Notification = {
    id: crypto.randomUUID(),
    ongId: input.ongId,
    petId: input.petId,
    petName: input.petName,
    adopterId: input.adopterId,
    adopterName: input.adopterName,
    adopterAvatarUrl: input.adopterAvatarUrl,
    type: "interesse",
    message: input.message,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  await writeNotifications([...notifications, notification]);
  return notification;
}

/** Apaga as notificações em que o usuário é a ONG ou o adotante (exclusão de conta). */
export async function deleteNotificationsOfUser(userId: string): Promise<void> {
  const notifications = await readNotifications();
  await writeNotifications(
    notifications.filter((n) => n.ongId !== userId && n.adopterId !== userId),
  );
}
