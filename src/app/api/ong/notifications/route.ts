import {
  countUnreadByOng,
  listNotificationsByOng,
  markAllReadByOng,
} from "@/lib/notifications";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/ong/notifications — notificações da ONG logada, mais recente
 * primeiro, com a contagem de não lidas.
 * PATCH /api/ong/notifications — marca todas como lidas. Body: { markAllRead: true }
 */

async function requireOng() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "ong" || !user.ong) {
    return {
      user: null,
      response: NextResponse.json(
        { message: "Faça login com uma conta de ONG." },
        { status: 401 },
      ),
    };
  }
  return { user, response: null };
}

export async function GET() {
  const { user, response } = await requireOng();
  if (!user) return response;

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsByOng(user.id),
    countUnreadByOng(user.id),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireOng();
  if (!user) return response;

  const body = (await request.json()) as { markAllRead?: boolean };
  if (body.markAllRead) {
    await markAllReadByOng(user.id);
  }
  return NextResponse.json({ unreadCount: await countUnreadByOng(user.id) });
}
