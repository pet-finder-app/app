import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Camada de acesso aos usuários — hoje um arquivo JSON, amanhã o backend.
 *
 * Só este arquivo precisa mudar quando a API real entrar: troque o corpo de
 * `readUsers` e `createUser` por chamadas HTTP e mantenha as assinaturas.
 */

export const SESSION_COOKIE = "petfinder_session";

/**
 * Adotante ou ONG — escolhido na primeira etapa do cadastro. Hoje os dois
 * usam o mesmo formulário (só o rótulo do nome muda); quando o formulário
 * específico da ONG existir, os campos extras entram aqui.
 */
export type AccountRole = "adopter" | "ong";

export type StoredUser = {
  id: string;
  role: AccountRole;
  name: string;
  email: string;
  password: string;
  avatarUrl: string | null;
};

/** O usuário como ele trafega para o front — nunca inclui a senha. */
export type PublicUser = Omit<StoredUser, "password">;

const USERS_FILE = path.join(process.cwd(), "src", "data", "users.json");

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function readUsers(): Promise<StoredUser[]> {
  const raw = await fs.readFile(USERS_FILE, "utf-8");
  return (JSON.parse(raw) as { users: StoredUser[] }).users;
}

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  return users.find(
    (user) => normalizeEmail(user.email) === normalizeEmail(email),
  );
}

export async function createUser(input: {
  role: AccountRole;
  name: string;
  email: string;
  password: string;
}): Promise<StoredUser> {
  const users = await readUsers();

  const user: StoredUser = {
    id: crypto.randomUUID(),
    role: input.role,
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    password: input.password,
    avatarUrl: null,
  };

  await fs.writeFile(
    USERS_FILE,
    JSON.stringify({ users: [...users, user] }, null, 2) + "\n",
    "utf-8",
  );

  return user;
}
