import { consumePasswordReset } from "@/lib/password-resets";
import { setUserPassword } from "@/lib/users";
import { NextResponse } from "next/server";

/** POST /api/auth/redefinir-senha — Body: { token, password }. */
export async function POST(request: Request) {
  const { token, password } = (await request.json()) as {
    token?: string;
    password?: string;
  };
  if (!token || !password) {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { message: "A senha precisa ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }

  const userId = await consumePasswordReset(token);
  if (!userId || !(await setUserPassword(userId, password))) {
    return NextResponse.json(
      { message: "Link inválido ou vencido. Peça um novo." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
