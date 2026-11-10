import { isSameOrigin } from "@/lib/backend/session-cookies";
import {
  LOCATION_COOKIE,
  LOCATION_ENABLED_COOKIE,
  isLocationEnabled,
  readSavedLocation,
} from "@/lib/location";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

/** Browser display preferences only; discovery coordinates are query parameters to the Go API. */
export async function GET() {
  return NextResponse.json(
    {
      enabled: await isLocationEnabled(),
      coordinates: await readSavedLocation(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
async function save(request: NextRequest) {
  if (!isSameOrigin(request))
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  if (
    !request.cookies.get(ACCESS_COOKIE) &&
    !request.cookies.get(REFRESH_COOKIE)
  )
    return NextResponse.json({ message: "Entre novamente." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  } as const;
  if (request.method === "DELETE") {
    response.cookies.delete(LOCATION_COOKIE);
    response.cookies.set(LOCATION_ENABLED_COOKIE, "0", options);
    return response;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Coordenadas inválidas." },
      { status: 400 },
    );
  }
  const input = z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    })
    .safeParse(body);
  if (!input.success)
    return NextResponse.json(
      { message: "Coordenadas inválidas." },
      { status: 400 },
    );
  response.cookies.set(
    LOCATION_COOKIE,
    `${input.data.lat.toFixed(3)},${input.data.lon.toFixed(3)}`,
    options,
  );
  response.cookies.set(LOCATION_ENABLED_COOKIE, "1", options);
  return response;
}
export { save as DELETE, save as POST };
