import type { PetUpdateInput } from "@/lib/pet";
import { validatePetInput } from "@/lib/pet";
import {
  deletePet,
  getPetByIdAndOng,
  setPetArchived,
  setPetStatusByOng,
  updatePet,
} from "@/lib/pets";
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

  const current = await getPetByIdAndOng(id, user.id);
  if (current?.status === "adotado") {
    return NextResponse.json(
      { message: "Pets já adotados não podem ser editados." },
      { status: 409 },
    );
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
 * PATCH /api/ong/pets/[id] — arquiva/desarquiva um pet publicado ou o marca
 * como indisponível/disponível. Body: { archived: boolean } ou
 * { status: "indisponivel" | "disponivel" } (só enquanto não está em processo
 * de adoção nem adotado).
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

  const body = (await request.json()) as {
    archived?: boolean;
    status?: string;
  };

  if (body.status === "indisponivel" || body.status === "disponivel") {
    const pet = await setPetStatusByOng(id, user.id, body.status);
    if (pet === "locked") {
      return NextResponse.json(
        {
          message:
            "Este pet está em processo de adoção ou já foi adotado: o estado muda pelo processo de adoção.",
        },
        { status: 409 },
      );
    }
    if (!pet) {
      return NextResponse.json(
        { message: "Pet não encontrado." },
        { status: 404 },
      );
    }
    return NextResponse.json({ pet });
  }

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

/**
 * DELETE /api/ong/pets/[id] — apaga um pet publicado de vez.
 * Só o dono (a ONG que cadastrou) pode apagar.
 */
export async function DELETE(
  _request: Request,
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

  const deleted = await deletePet(id, user.id);
  if (!deleted) {
    return NextResponse.json(
      { message: "Pet não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
