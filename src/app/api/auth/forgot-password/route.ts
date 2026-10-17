import { createPasswordReset } from "@/lib/password-resets";
import { findUserByEmail } from "@/lib/users";
import { NextResponse } from "next/server";

/** Request a password reset without revealing account existence. The prototype returns an existing account's reset link in devLink; production must deliver it by email. */
export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  if (!email?.trim()) {
    return NextResponse.json(
      { message: "Informe seu e-mail." },
      { status: 400 },
    );
  }

  const user = await findUserByEmail(email);
  const devLink = user
    ? `/reset-password?token=${await createPasswordReset(user.id)}`
    : undefined;

  return NextResponse.json({ ok: true, devLink });
}
