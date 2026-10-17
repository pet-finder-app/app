import { promises as fs } from "node:fs";
import path from "node:path";
import { createEmptyAdopterProfile, type AdopterProfile } from "./adopter";
import {
  createEmptyNgoProfile,
  type NgoProfile,
  type NgoSignupInput,
  type TermsAcceptance,
} from "./ngo";

/** User persistence adapter using JSON. A production API can replace these functions without changing their public signatures. */

export const SESSION_COOKIE = "petfinder_session";

/** Account type selected during signup: adopter or NGO. */
export type AccountRole = "adopter" | "ngo";

export type StoredUser = {
  id: string;
  role: AccountRole;
  /** Personal display name or NGO trading name. */
  name: string;
  email: string;
  password: string;
  avatarUrl: string | null;
  /** ISO timestamp. */
  createdAt: string;
  /** Present only for NGO accounts. */
  ngo?: NgoProfile;
  /** Present only for adopter accounts. */
  adopter?: AdopterProfile;
};

/** Public user projection that never includes the password. */
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

/** Whether an NGO already uses this tax document. */
export async function findNgoByDocument(
  document: string,
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  return users.find((user) => user.ngo?.legal.document === document);
}

/** Whether an NGO already uses this nickname, compared without case sensitivity. */
export async function findNgoByNickname(
  nickname: string,
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  return users.find(
    (user) => user.ngo?.legal.nickname.toLowerCase() === nickname.toLowerCase(),
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
      role: "ngo";
      email: string;
      password: string;
      ngo: Omit<NgoSignupInput, "email">;
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
          role: "ngo",
          name: input.ngo.tradeName.trim(),
          ngo: createEmptyNgoProfile({
            ...input.ngo,
            tradeName: input.ngo.tradeName.trim(),
            email,
          }),
        };

  await writeUsers([...users, user]);

  return user;
}

export async function updateNgoProfile(
  userId: string,
  profile: NgoProfile,
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1 || users[index].role !== "ngo") return undefined;

  const updated: StoredUser = {
    ...users[index],
    name: profile.legal.tradeName.trim() || users[index].name,
    ngo: profile,
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

/** Update a user's password; return false if the account does not exist. */
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

/** Delete a user; return false if the account does not exist. */
export async function deleteUser(userId: string): Promise<boolean> {
  const users = await readUsers();
  const remaining = users.filter((user) => user.id !== userId);
  if (remaining.length === users.length) return false;
  await writeUsers(remaining);
  return true;
}
