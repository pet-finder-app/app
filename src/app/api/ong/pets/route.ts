import type { PetInput } from "@/lib/pet";
import { validatePetInput } from "@/lib/pet";
import { createPet, listPetsByOng } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/ong/pets — pets da ONG logada.
 * POST /api/ong/pets — cadastra um novo pet. Body: { pet: PetInput }
 *
 * Só ONGs verificadas podem publicar. As demais já sabem disso pelo
 * checklist do cadastro (ver `lib/ong.ts`).
 */

async function requireOng(request: Request) {
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
  void request;
  return { user, response: null };
}

export async function GET(request: Request) {
  const { user, response } = await requireOng(request);
  if (!user) return response;

  const pets = await listPetsByOng(user.id);
  return NextResponse.json({ pets });
}

export async function POST(request: Request) {
  const { user, response } = await requireOng(request);
  if (!user) return response;

  if (user.ong!.verification.status !== "verificada") {
    return NextResponse.json(
      {
        message:
          "Sua ONG precisa estar verificada para publicar pets. Complete o cadastro em /ong/configuracoes.",
      },
      { status: 403 },
    );
  }

  const body = (await request.json()) as { pet?: PetInput };
  const input = body.pet;
  if (!input || typeof input !== "object") {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const validationError = validatePetInput(input);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const name = input.name.trim().toLowerCase();
  const existing = (await listPetsByOng(user.id)).find(
    (pet) => !pet.archived && pet.name.trim().toLowerCase() === name,
  );
  if (existing) {
    return NextResponse.json(
      {
        message: `Você já tem um pet chamado ${existing.name}. Se for outro animal, use um nome diferente (ex.: ${existing.name} 2).`,
      },
      { status: 409 },
    );
  }

  const pet = await createPet(user.id, input);
  return NextResponse.json({ pet }, { status: 201 });
}
