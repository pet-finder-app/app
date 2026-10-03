import { toClientSurrender } from "@/lib/surrender";
import { createSurrender, type CreateSurrenderInput } from "@/lib/surrenders";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/acolhimentos — o adotante pede para deixar um pet com uma ONG.
 * Body: { ongId, adoptionId?, pet, form }
 */
export async function POST(request: Request) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "adopter" || !user.adopter) {
    return NextResponse.json(
      { message: "Faça login com uma conta de adotante." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as Partial<CreateSurrenderInput>;
  if (!body.ongId || !body.pet || !body.form) {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const result = await createSurrender(user.id, {
    ongId: body.ongId,
    adoptionId: body.adoptionId ?? null,
    pet: body.pet,
    form: body.form,
  });
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }
  return NextResponse.json(
    { surrender: toClientSurrender(result.surrender) },
    { status: 201 },
  );
}
