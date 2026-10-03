import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Quem o adotante segue (adotante → ONG). Hoje um arquivo JSON, amanhã o
 * backend — só este arquivo muda (ver `lib/notifications.ts`).
 */

export type Follow = {
  adopterId: string;
  ongId: string;
  /** ISO datetime. */
  createdAt: string;
};

const FOLLOWS_FILE = path.join(process.cwd(), "src", "data", "follows.json");

async function readFollows(): Promise<Follow[]> {
  const raw = await fs.readFile(FOLLOWS_FILE, "utf-8");
  return (JSON.parse(raw) as { follows: Follow[] }).follows;
}

async function writeFollows(follows: Follow[]): Promise<void> {
  await fs.writeFile(
    FOLLOWS_FILE,
    JSON.stringify({ follows }, null, 2) + "\n",
    "utf-8",
  );
}

/** IDs das ONGs que o adotante segue. */
export async function listFollowedOngIds(adopterId: string): Promise<string[]> {
  const follows = await readFollows();
  return follows.filter((f) => f.adopterId === adopterId).map((f) => f.ongId);
}

/** Alterna seguir/deixar de seguir. Retorna se agora está seguindo. */
export async function toggleFollow(
  adopterId: string,
  ongId: string,
): Promise<{ following: boolean }> {
  const follows = await readFollows();
  const exists = follows.some(
    (f) => f.adopterId === adopterId && f.ongId === ongId,
  );
  if (exists) {
    await writeFollows(
      follows.filter((f) => !(f.adopterId === adopterId && f.ongId === ongId)),
    );
    return { following: false };
  }
  await writeFollows([
    ...follows,
    { adopterId, ongId, createdAt: new Date().toISOString() },
  ]);
  return { following: true };
}

/** Apaga o que o usuário segue e quem o segue (exclusão de conta). */
export async function deleteFollowsOfUser(userId: string): Promise<void> {
  const follows = await readFollows();
  await writeFollows(
    follows.filter((f) => f.adopterId !== userId && f.ongId !== userId),
  );
}
