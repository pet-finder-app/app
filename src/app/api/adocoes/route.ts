import { toClientAdoption } from "@/lib/adoption";
import { startAdoption } from "@/lib/adoptions";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** POST /api/adocoes — a ONG inicia a adoção a partir de uma conversa. Body: { conversationId } */
export async function POST(request: Request) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "ong" || !user.ong) {
    return NextResponse.json(
      { message: "Faça login com uma conta de ONG." },
      { status: 401 },
    );
  }
  if (user.ong.verification.status !== "verificada") {
    return NextResponse.json(
      { message: "Sua ONG precisa estar verificada para iniciar adoções." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as { conversationId?: string };
  if (!body.conversationId) {
    return NextResponse.json(
      { message: "Conversa inválida." },
      { status: 400 },
    );
  }

  const result = await startAdoption(user.id, body.conversationId);
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }
  return NextResponse.json(
    { adoption: toClientAdoption(result.adoption) },
    { status: 201 },
  );
}
