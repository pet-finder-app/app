import { promises as fs } from "node:fs";
import path from "node:path";

/** Persist adopter-to-NGO follow relationships using the JSON adapter. */

export type Follow = {
  adopterId: string;
  ngoId: string;
  /** ISO timestamp. */
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

/** Identifiers of the NGOs followed by this adopter. */
export async function listFollowedNgoIds(adopterId: string): Promise<string[]> {
  const follows = await readFollows();
  return follows.filter((f) => f.adopterId === adopterId).map((f) => f.ngoId);
}

/** Toggle following and return the resulting state. */
export async function toggleFollow(
  adopterId: string,
  ngoId: string,
): Promise<{ following: boolean }> {
  const follows = await readFollows();
  const exists = follows.some(
    (f) => f.adopterId === adopterId && f.ngoId === ngoId,
  );
  if (exists) {
    await writeFollows(
      follows.filter((f) => !(f.adopterId === adopterId && f.ngoId === ngoId)),
    );
    return { following: false };
  }
  await writeFollows([
    ...follows,
    { adopterId, ngoId, createdAt: new Date().toISOString() },
  ]);
  return { following: true };
}

/** Remove outgoing and incoming follows during account deletion. */
export async function deleteFollowsOfUser(userId: string): Promise<void> {
  const follows = await readFollows();
  await writeFollows(
    follows.filter((f) => f.adopterId !== userId && f.ngoId !== userId),
  );
}
