import { toClientSurrender } from "@/lib/surrender";
import { performAction, type SurrenderAction } from "@/lib/surrenders";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Apply a surrender action. Authorization and state transitions are enforced by the surrender service. */

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
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

  const body = (await request.json()) as SurrenderAction;
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
    surrender: toClientSurrender(result.surrender),
    devCode: result.devCode,
  });
}
