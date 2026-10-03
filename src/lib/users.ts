import { promises as fs } from "node:fs";
import path from "node:path";
import { createEmptyAdopterProfile, type AdopterProfile } from "./adopter";
import {
  createEmptyOngProfile,
  type OngProfile,
  type OngSignupInput,
  type TermsAcceptance,
} from "./ong";

/**
 * Camada de acesso aos usuários — hoje um arquivo JSON, amanhã o backend.
 *
 * Só este arquivo precisa mudar quando a API real entrar: troque o corpo de
 * `readUsers`, `createUser` e `updateOngProfile` por chamadas HTTP e mantenha
 * as assinaturas.
 */

export const SESSION_COOKIE = "petfinder_session";

/** Adotante ou ONG — escolhido na primeira etapa do cadastro. */
export type AccountRole = "adopter" | "ong";

export type StoredUser = {
  id: string;
  role: AccountRole;
  /** Adotante: nome. ONG: nome fantasia (espelha `ong.legal.tradeName`). */
  name: string;
  email: string;
  password: string;
  avatarUrl: string | null;
  /** ISO datetime. */
  createdAt: string;
  /** Presente só quando `role === "ong"`. Ver `lib/ong.ts`. */
  ong?: OngProfile;
  /** Presente só quando `role === "adopter"`. Ver `lib/adopter.ts`. */
  adopter?: AdopterProfile;
};

/** O usuário como ele trafega para o front — nunca inclui a senha. */
export type PublicUser = Omit<StoredUser, "password">;

const USERS_FILE = path.join(process.cwd(), "src", "data", "users.json");

export function toPublicUser(user: StoredUser): PublicUser {
  const { password: _password, ...publicUser } = user;
  void _password;
  return publicUser;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function readUsers(): Promise<StoredUser[]> {
  const raw = await fs.readFile(USERS_FILE, "utf-8");
  return (JSON.parse(raw) as { users: StoredUser[] }).users;
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await fs.writeFile(
    USERS_FILE,
    JSON.stringify({ users }, null, 2) + "\n",
    "utf-8",
  );
}

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  return users.find(
    (user) => normalizeEmail(user.email) === normalizeEmail(email),
  );
}

export async function findUserById(
  id: string,
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  return users.find((user) => user.id === id);
}

/** Já existe uma ONG com esse CPF/CNPJ? */
export async function findOngByDocument(
  document: string,
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  return users.find((user) => user.ong?.legal.document === document);
}

/** Já existe uma ONG com esse nickname? Comparação sem diferenciar maiúsculas. */
export async function findOngByNickname(
  nickname: string,
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  return users.find(
    (user) => user.ong?.legal.nickname.toLowerCase() === nickname.toLowerCase(),
  );
}

export type CreateUserInput =
  | {
      role: "adopter";
      name: string;
      email: string;
      password: string;
      terms?: TermsAcceptance;
    }
  | {
      role: "ong";
      email: string;
      password: string;
      ong: Omit<OngSignupInput, "email">;
    };

function withTerms(
  profile: AdopterProfile,
  terms: TermsAcceptance | undefined,
): AdopterProfile {
  return terms ? { ...profile, legalConsent: { terms } } : profile;
}

export async function createUser(input: CreateUserInput): Promise<StoredUser> {
  const users = await readUsers();
  const email = normalizeEmail(input.email);

  const base = {
    id: crypto.randomUUID(),
    email,
    password: input.password,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };

  const user: StoredUser =
    input.role === "adopter"
      ? {
          ...base,
          role: "adopter",
          name: input.name.trim(),
          adopter: withTerms(
            createEmptyAdopterProfile(input.name.trim()),
            input.terms,
          ),
        }
      : {
          ...base,
          role: "ong",
          name: input.ong.tradeName.trim(),
          ong: createEmptyOngProfile({
            ...input.ong,
            tradeName: input.ong.tradeName.trim(),
            email,
          }),
        };

  await writeUsers([...users, user]);

  return user;
}

export async function updateOngProfile(
  userId: string,
  profile: OngProfile,
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1 || users[index].role !== "ong") return undefined;

  const updated: StoredUser = {
    ...users[index],
    name: profile.legal.tradeName.trim() || users[index].name,
    ong: profile,
  };
  users[index] = updated;
  await writeUsers(users);
  return updated;
}

export async function updateAdopterProfile(
  userId: string,
  profile: AdopterProfile,
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1 || users[index].role !== "adopter") return undefined;

  const updated: StoredUser = {
    ...users[index],
    name: profile.personal.fullName.trim() || users[index].name,
    adopter: profile,
  };
  users[index] = updated;
  await writeUsers(users);
  return updated;
}

/** Troca a senha do usuário. Retorna false se ele não existir. */
export async function setUserPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return false;
  users[index] = { ...users[index], password };
  await writeUsers(users);
  return true;
}

/** Apaga o usuário. Retorna false se ele não existir. */
export async function deleteUser(userId: string): Promise<boolean> {
  const users = await readUsers();
  const remaining = users.filter((user) => user.id !== userId);
  if (remaining.length === users.length) return false;
  await writeUsers(remaining);
  return true;
}
