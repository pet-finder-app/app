import { createPasswordReset } from "@/lib/password-resets";
import { findUserByEmail } from "@/lib/users";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/esqueci-senha — Body: { email }. A resposta é a mesma exista
 * ou não a conta, para não revelar quem está cadastrado. Protótipo: o link
 * volta em `devLink` só quando a conta existe; com backend sai por e-mail.
 */
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
    ? `/redefinir-senha?token=${await createPasswordReset(user.id)}`
    : undefined;

  return NextResponse.json({ ok: true, devLink });
}
