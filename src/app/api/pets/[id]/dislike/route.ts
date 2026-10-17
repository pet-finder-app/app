import { setPetHidden, toggleDislike } from "@/lib/dislikes";
import { getPetById } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Toggle the current adopter's lack of interest. Discarded pets leave the feed and remain accessible in the discarded list. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "adopter" || !user.adopter) {
    return NextResponse.json(
      { message: "Faça login com uma conta de adotante." },
      { status: 401 },
    );
  }

  const pet = await getPetById(id);
  if (!pet) {
    return NextResponse.json(
      { message: "Pet não encontrado." },
      { status: 404 },
    );
  }

  if (request.headers.get("content-type")?.includes("application/json")) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Preferência inválida." },
        { status: 400 },
      );
    }
    if (
      typeof body !== "object" ||
      body === null ||
      !("hidden" in body) ||
      typeof body.hidden !== "boolean"
    ) {
      return NextResponse.json(
        { message: "Preferência inválida." },
        { status: 400 },
      );
    }
    return NextResponse.json(await setPetHidden(user.id, pet.id, body.hidden));
  }
  return NextResponse.json(await toggleDislike(user.id, pet.id));
}
