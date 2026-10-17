import { getPetById } from "@/lib/pets";
import { readPosts } from "@/lib/posts";
import { isContentReportInput } from "@/lib/report";
import { createContentReport } from "@/lib/reports";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "adopter" || !user.adopter) {
    return NextResponse.json(
      { message: "Faça login com uma conta de adotante." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }
  if (!isContentReportInput(body)) {
    return NextResponse.json(
      { message: "Descreva o motivo usando de 10 a 2.000 caracteres." },
      { status: 400 },
    );
  }
  const exists =
    body.targetType === "pet"
      ? Boolean(await getPetById(body.targetId))
      : (await readPosts()).some((post) => post.id === body.targetId);
  if (!exists) {
    return NextResponse.json(
      { message: "Publicação não encontrada." },
      { status: 404 },
    );
  }

  try {
    await createContentReport(user.id, body);
    return NextResponse.json({ received: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível registrar a denúncia. Tente novamente." },
      { status: 500 },
    );
  }
}
