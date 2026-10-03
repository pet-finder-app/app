import { toClientAdoption } from "@/lib/adoption";
import { performAction, type AdoptionAction } from "@/lib/adoptions";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/adocoes/[id] — executa uma ação do processo de adoção.
 * Body: { action, ...dados }. Quem pode fazer cada ação é conferido em
 * `lib/adoptions.ts`.
 */

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "desconhecido"
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user) {
    return NextResponse.json({ message: "Faça login." }, { status: 401 });
  }

  const body = (await request.json()) as AdoptionAction;
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ message: "Ação inválida." }, { status: 400 });
  }

  const result = await performAction(
    id,
    {
      id: user.id,
      role: user.role,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? "",
    },
    body,
  );
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }
  return NextResponse.json({
    adoption: toClientAdoption(result.adoption),
    devCode: result.devCode,
  });
}
