import { MAX_MESSAGE_LENGTH, type ChatRole } from "@/lib/conversation";
import { appendMessage, getConversationById } from "@/lib/conversations";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** POST /api/conversas/[id]/mensagens — envia uma mensagem. Body: { text } */
export async function POST(
  request: Request,
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
        : user.id === conversation.ongId
          ? "ong"
          : null
      : null;

  if (!user || !conversation || !role) {
    return NextResponse.json(
      { message: "Conversa não encontrada." },
      { status: 404 },
    );
  }

  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json(
      { message: "Escreva uma mensagem." },
      { status: 400 },
    );
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { message: `A mensagem passou de ${MAX_MESSAGE_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  const result = await appendMessage(id, user.id, role, text);
  return NextResponse.json({ message: result?.message }, { status: 201 });
}
