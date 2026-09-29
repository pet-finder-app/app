import { createInteresse } from "@/lib/notifications";
import { getPetById } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/pets/[id]/interesse — envia uma mensagem de interesse real em
 * adotar, gerando uma notificação para a ONG dona do pet. Body: { message }
 */

async function requireAdopter() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "adopter" || !user.adopter) {
    return {
      user: null,
      response: NextResponse.json(
        { message: "Faça login com uma conta de adotante." },
        { status: 401 },
      ),
    };
  }
  return { user, response: null };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, response } = await requireAdopter();
  if (!user) return response;

  const pet = await getPetById(id);
  if (!pet) {
    return NextResponse.json(
      { message: "Pet não encontrado." },
      { status: 404 },
    );
  }

  const body = (await request.json()) as { message?: string };
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json(
      { message: "Escreva uma mensagem para a ONG." },
      { status: 400 },
    );
  }

  const notification = await createInteresse({
    ongId: pet.ongId,
    petId: pet.id,
    petName: pet.name,
    adopterId: user.id,
    adopterName: user.name,
    adopterAvatarUrl: user.avatarUrl,
    message,
  });

  return NextResponse.json({ notification }, { status: 201 });
}
