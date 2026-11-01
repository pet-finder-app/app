import type { ChatRole } from "@/lib/conversation";
import { getConversationById, markConversationRead } from "@/lib/conversations";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Poll conversation messages and mark them read for the current participant. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  const conversation = await getConversationById(id);

  const role: ChatRole | null =
    user && conversation
      ? user.id === conversation.adopterId
        ? "adopter"
        : user.id === conversation.ngoId
          ? "ngo"
          : null
      : null;

  if (!user || !conversation || !role) {
    return NextResponse.json(
      { message: "Conversa não encontrada." },
      { status: 404 },
    );
  }

  await markConversationRead(id, role);
  return NextResponse.json({ messages: conversation.messages });
}
