import { LOCATION_COOKIE, LOCATION_ENABLED_COOKIE } from "@/lib/location";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Save approximate browser coordinates and the GPS preference. Turning GPS off restores profile postal-code fallback. */
async function requireAdopter() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  return user?.role === "adopter" ? user : null;
}

export async function POST(request: Request) {
  if (!(await requireAdopter())) {
    return NextResponse.json({ message: "Faça login." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Localização inválida." },
      { status: 400 },
    );
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("lat" in body) ||
    typeof body.lat !== "number" ||
    !Number.isFinite(body.lat) ||
    !("lon" in body) ||
    typeof body.lon !== "number" ||
    !Number.isFinite(body.lon) ||
    Math.abs(body.lat) > 90 ||
    Math.abs(body.lon) > 180
  ) {
    return NextResponse.json(
      { message: "Localização inválida." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    LOCATION_COOKIE,
    `${body.lat.toFixed(2)},${body.lon.toFixed(2)}`,
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );
  response.cookies.set(LOCATION_ENABLED_COOKIE, "1", {
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
  response.cookies.set(LOCATION_ENABLED_COOKIE, "0", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
