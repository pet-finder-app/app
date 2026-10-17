import { toggleLike } from "@/lib/notifications";
import { getPetById } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Toggle the current adopter's pet like and create or remove the owning NGO's notification. */

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

  const result = await toggleLike(
    {
      ngoId: pet.ngoId,
      petId: pet.id,
      petName: pet.name,
      adopterId: user.id,
      adopterName: user.name,
      adopterAvatarUrl: user.avatarUrl,
    },
    request.method === "PUT" ? true : undefined,
  );

  return NextResponse.json(result);
}

/** Double-tapping sets the like instead of toggling an existing like off. */
export const PUT = POST;
