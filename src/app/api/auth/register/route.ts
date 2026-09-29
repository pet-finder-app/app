import { isValidDocument, onlyDigits } from "@/lib/br-documents";
import {
  isOrganizationType,
  isValidNickname,
  normalizeNickname,
  ORGANIZATION_TYPES,
  TERMS_VERSION,
} from "@/lib/ong";
import type { AccountRole } from "@/lib/users";
import {
  createUser,
  findOngByDocument,
  findOngByNickname,
  findUserByEmail,
  SESSION_COOKIE,
  toPublicUser,
} from "@/lib/users";
import { NextResponse } from "next/server";

function isAccountRole(value: unknown): value is AccountRole {
  return value === "adopter" || value === "ong";
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "desconhecido"
  );
}

type RegisterBody = {
  role?: string;
  name?: string;
  email?: string;
  password?: string;
  /** ONG: tipo de organização, CPF/CNPJ (com ou sem máscara), nickname e aceite. */
  organizationType?: string;
  document?: string;
  nickname?: string;
  acceptedTerms?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterBody;
  const { role, name, email, password } = body;

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

  if (role === "adopter") {
    const created = await createUser({ role, name, email, password });
    return respondWithSession(created);
  }

  // --- ONG -----------------------------------------------------------------

  if (!isOrganizationType(body.organizationType)) {
    return NextResponse.json(
      { message: "Escolha o tipo de organização.", field: "organizationType" },
      { status: 400 },
    );
  }

  const { documentType } = ORGANIZATION_TYPES[body.organizationType];
  const document = onlyDigits(body.document ?? "");

  if (!isValidDocument(documentType, document)) {
    return NextResponse.json(
      {
        message: `Informe um ${documentType.toUpperCase()} válido.`,
        field: "document",
      },
      { status: 400 },
    );
  }

  if (await findOngByDocument(document)) {
    return NextResponse.json(
      {
        message: `Já existe uma ONG cadastrada com esse ${documentType.toUpperCase()}.`,
        field: "document",
      },
      { status: 409 },
    );
  }

  const nickname = normalizeNickname(body.nickname ?? "");

  if (!isValidNickname(nickname)) {
    return NextResponse.json(
      {
        message:
          "O nome de usuário precisa ter de 3 a 24 letras, números ou _, sem espaços.",
        field: "nickname",
      },
      { status: 400 },
    );
  }

  if (await findOngByNickname(nickname)) {
    return NextResponse.json(
      { message: "Esse nome de usuário já está em uso.", field: "nickname" },
      { status: 409 },
    );
  }

  if (body.acceptedTerms !== true) {
    return NextResponse.json(
      {
        message: "É preciso aceitar os termos de uso para continuar.",
        field: "acceptedTerms",
      },
      { status: 400 },
    );
  }

  const created = await createUser({
    role: "ong",
    email,
    password,
    ong: {
      organizationType: body.organizationType,
      document,
      tradeName: name,
      nickname,
      terms: {
        version: TERMS_VERSION,
        acceptedAt: new Date().toISOString(),
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent") ?? "",
      },
    },
  });

  return respondWithSession(created);
}

function respondWithSession(user: Awaited<ReturnType<typeof createUser>>) {
  const response = NextResponse.json(
    { user: toPublicUser(user) },
    { status: 201 },
  );

  response.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
