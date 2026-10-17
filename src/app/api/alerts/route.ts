import { getAlerts } from "@/lib/alerts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Return navigation counts and the current account's profile photo. */
export async function GET() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user) {
    return NextResponse.json({ chats: 0, adoptions: 0 }, { status: 401 });
  }
  const alerts = await getAlerts(user.id, user.role);
  return NextResponse.json({
    chats: alerts.chats,
    adoptions: alerts.adoptionsToAct.length,
    avatarUrl:
      (user.role === "ngo"
        ? user.ngo?.publicProfile.logo?.url
        : user.adopter?.personal.avatar?.url) ?? user.avatarUrl,
  });
}
