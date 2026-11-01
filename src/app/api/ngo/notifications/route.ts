import {
  countUnreadByNgo,
  listNotificationsByNgo,
  markAllReadByNgo,
} from "@/lib/notifications";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Get the current NGO's notifications and unread count, or mark them all read. */

async function requireNgo() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "ngo" || !user.ngo) {
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
  const { user, response } = await requireNgo();
  if (!user) return response;

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsByNgo(user.id),
    countUnreadByNgo(user.id),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireNgo();
  if (!user) return response;

  const body = (await request.json()) as { markAllRead?: boolean };
  if (body.markAllRead) {
    await markAllReadByNgo(user.id);
  }
  return NextResponse.json({ unreadCount: await countUnreadByNgo(user.id) });
}
