import { saveTermTemplate } from "@/lib/term-templates";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const MAX_TEMPLATE_LENGTH = 20000;

/** PUT /api/ong/termo — salva o modelo de termo da ONG. Body: { body } (vazio = voltar ao padrão) */
export async function PUT(request: Request) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "ong" || !user.ong) {
    return NextResponse.json(
      { message: "Faça login com uma conta de ONG." },
      { status: 401 },
    );
  }

  const data = (await request.json()) as { body?: string };
  const text = typeof data.body === "string" ? data.body : "";
  if (text.length > MAX_TEMPLATE_LENGTH) {
    return NextResponse.json(
      { message: "O termo ficou grande demais." },
      { status: 400 },
    );
  }

  await saveTermTemplate(user.id, text);
  return NextResponse.json({ ok: true });
}
