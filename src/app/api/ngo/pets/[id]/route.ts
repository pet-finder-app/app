import type { PetUpdateInput } from "@/lib/pet";
import { validatePetInput } from "@/lib/pet";
import {
  deletePet,
  getPetByIdAndNgo,
  setPetArchived,
  setPetStatusByNgo,
  updatePet,
} from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Update a published pet. Only its owning NGO may edit it. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user || user.role !== "ngo" || !user.ngo) {
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

  const current = await getPetByIdAndNgo(id, user.id);
  if (current?.status === "adopted") {
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

/** Archive a pet or toggle availability. Adoption-controlled states cannot be changed through this endpoint. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user || user.role !== "ngo" || !user.ngo) {
    return NextResponse.json(
      { message: "Faça login com uma conta de ONG." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    archived?: boolean;
    status?: string;
  };

  if (body.status === "unavailable" || body.status === "available") {
    const pet = await setPetStatusByNgo(id, user.id, body.status);
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

/** Permanently delete a published pet. Only its owning NGO may delete it. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user || user.role !== "ngo" || !user.ngo) {
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
