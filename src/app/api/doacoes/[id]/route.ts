import { resolveDonation } from "@/lib/donations";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/doacoes/[id] — a ONG responde a uma doação informada.
 * Body: { action: "confirm" | "not_found" }
 */
export async function POST(
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

  const body = (await request.json()) as { action?: string };
  if (body.action !== "confirm" && body.action !== "not_found") {
    return NextResponse.json({ message: "Ação inválida." }, { status: 400 });
  }

  const result = await resolveDonation(
    id,
    user.id,
    body.action === "confirm" ? "confirmada" : "nao_localizada",
  );
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }
  return NextResponse.json({ donation: result.donation });
}
