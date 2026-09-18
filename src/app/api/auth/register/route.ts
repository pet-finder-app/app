import type { AccountRole } from "@/lib/users";
import {
  createUser,
  findUserByEmail,
  SESSION_COOKIE,
  toPublicUser,
} from "@/lib/users";
import { NextResponse } from "next/server";

function isAccountRole(value: unknown): value is AccountRole {
  return value === "adopter" || value === "ong";
}

export async function POST(request: Request) {
  const { role, name, email, password } = (await request.json()) as {
    role?: string;
    name?: string;
    email?: string;
    password?: string;
  };

  if (!isAccountRole(role)) {
    return NextResponse.json(
      { message: "Selecione se você é ONG ou adotante." },
      { status: 400 },
    );
  }

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json(
      { message: "Preencha todos os campos." },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      {
        message: "A senha precisa ter ao menos 6 caracteres.",
        field: "password",
      },
      { status: 400 },
    );
  }

  if (await findUserByEmail(email)) {
    return NextResponse.json(
      { message: "Já existe uma conta com esse e-mail.", field: "email" },
      { status: 409 },
    );
  }

  const created = await createUser({ role, name, email, password });

  const response = NextResponse.json(
    { user: toPublicUser(created) },
    { status: 201 },
  );

  response.cookies.set(SESSION_COOKIE, created.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
