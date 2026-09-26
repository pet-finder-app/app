import type { PetUpdateInput } from "@/lib/pet";
import { validatePetInput } from "@/lib/pet";
import { setPetArchived, updatePet } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * PUT /api/ong/pets/[id] — edita um pet já publicado. Body: { pet: PetUpdateInput }
 * Só o dono (a ONG que cadastrou) pode editar.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user || user.role !== "ong" || !user.ong) {
    return NextResponse.json(
      { message: "Faça login com uma conta de ONG." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as { pet?: PetUpdateInput };
  const input = body.pet;
  if (!input || typeof input !== "object") {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const validationError = validatePetInput(input);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const pet = await updatePet(id, user.id, input);
  if (!pet) {
    return NextResponse.json(
      { message: "Pet não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({ pet });
}

/**
 * PATCH /api/ong/pets/[id] — arquiva ou desarquiva um pet publicado.
 * Body: { archived: boolean }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user || user.role !== "ong" || !user.ong) {
    return NextResponse.json(
      { message: "Faça login com uma conta de ONG." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as { archived?: boolean };
  if (typeof body.archived !== "boolean") {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const pet = await setPetArchived(id, user.id, body.archived);
  if (!pet) {
    return NextResponse.json(
      { message: "Pet não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({ pet });
}
