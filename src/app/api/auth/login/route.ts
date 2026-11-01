import { findUserByEmail, SESSION_COOKIE, toPublicUser } from "@/lib/users";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { message: "Informe e-mail e senha." },
      { status: 400 },
    );
  }

  const found = await findUserByEmail(email);

  if (!found || found.password !== password) {
    // Use a generic message to avoid revealing whether the email exists or
    // the password is incorrect. Omit a field-specific error so
    // the form marks both credentials as invalid.
    return NextResponse.json(
      { message: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ user: toPublicUser(found) });

  response.cookies.set(SESSION_COOKIE, found.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
