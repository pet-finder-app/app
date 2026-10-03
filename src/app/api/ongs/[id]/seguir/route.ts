import { toggleFollow } from "@/lib/follows";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** POST /api/ongs/[id]/seguir — o adotante segue/deixa de seguir uma ONG. */
export async function POST(
  _request: Request,
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

  const ong = await findUserById(id);
  if (!ong || ong.role !== "ong") {
    return NextResponse.json(
      { message: "ONG não encontrada." },
      { status: 404 },
    );
  }

  return NextResponse.json(await toggleFollow(user.id, ong.id));
}
