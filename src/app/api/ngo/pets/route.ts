import type { PetInput } from "@/lib/pet";
import { validatePetInput } from "@/lib/pet";
import { createPet, listPetsByNgo } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** List the current NGO's pets or publish a new pet. Publication requires a verified NGO. */

async function requireNgo(request: Request) {
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
  void request;
  return { user, response: null };
}

export async function GET(request: Request) {
  const { user, response } = await requireNgo(request);
  if (!user) return response;

  const pets = await listPetsByNgo(user.id);
  return NextResponse.json({ pets });
}

export async function POST(request: Request) {
  const { user, response } = await requireNgo(request);
  if (!user) return response;

  if (user.ngo!.verification.status !== "verified") {
    return NextResponse.json(
      {
        message:
          "Sua ONG precisa estar verificada para publicar pets. Complete o cadastro em /ngo/configuracoes.",
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
  const existing = (await listPetsByNgo(user.id)).find(
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
