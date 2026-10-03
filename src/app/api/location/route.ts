import { LOCATION_COOKIE } from "@/lib/location";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/location — guarda a localização do navegador do adotante (cookie,
 * arredondada para ~1 km). Body: { lat, lon }.
 * DELETE /api/location — esquece a localização e volta a usar o CEP do perfil.
 */
async function requireAdopter() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  return user?.role === "adopter" ? user : null;
}

export async function POST(request: Request) {
  if (!(await requireAdopter())) {
    return NextResponse.json({ message: "Faça login." }, { status: 401 });
  }
  const { lat, lon } = (await request.json()) as { lat?: number; lon?: number };
  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return NextResponse.json(
      { message: "Localização inválida." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCATION_COOKIE, `${lat.toFixed(2)},${lon.toFixed(2)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  if (!(await requireAdopter())) {
    return NextResponse.json({ message: "Faça login." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(LOCATION_COOKIE);
  return response;
}
