import { startConversationByNgo } from "@/lib/conversations";
import { listNotificationsByNgo } from "@/lib/notifications";
import { getPetByIdAndNgo } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Start an NGO conversation with a pet's interested adopter. Body: { adopterId }. */
export async function POST(
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

  const { adopterId } = (await request.json()) as { adopterId?: string };
  const pet = await getPetByIdAndNgo(id, user.id);
  if (!pet || !adopterId) {
    return NextResponse.json(
      { message: "Pet não encontrado." },
      { status: 404 },
    );
  }

  const interest = (await listNotificationsByNgo(user.id)).find(
    (n) => n.petId === pet.id && n.adopterId === adopterId,
  );
  if (!interest) {
    return NextResponse.json(
      { message: "Essa pessoa não demonstrou interesse neste pet." },
      { status: 403 },
    );
  }

  const conversation = await startConversationByNgo({
    petId: pet.id,
    petName: pet.name,
    ngoId: user.id,
    adopterId,
    adopterName: interest.adopterName,
    text: `Oi, ${interest.adopterName}! Vimos que você se interessou por ${pet.name}. Quer conversar sobre a adoção?`,
  });

  return NextResponse.json({ conversationId: conversation.id });
}
