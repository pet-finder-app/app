import { promises as fs } from "node:fs";
import path from "node:path";

/** Persist pets discarded by each adopter using the JSON adapter. */

export type Dislike = {
  adopterId: string;
  petId: string;
  /** ISO timestamp. */
  createdAt: string;
};

const DISLIKES_FILE = path.join(process.cwd(), "src", "data", "dislikes.json");

async function readDislikes(): Promise<Dislike[]> {
  const raw = await fs.readFile(DISLIKES_FILE, "utf-8");
  return (JSON.parse(raw) as { dislikes: Dislike[] }).dislikes;
}

async function writeDislikes(dislikes: Dislike[]): Promise<void> {
  await fs.writeFile(
    DISLIKES_FILE,
    JSON.stringify({ dislikes }, null, 2) + "\n",
    "utf-8",
  );
}

/** Discarded pet identifiers, newest first. */
export async function listDislikedPetIds(adopterId: string): Promise<string[]> {
  const dislikes = await readDislikes();
  return dislikes
    .filter((d) => d.adopterId === adopterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((d) => d.petId);
}

/** Toggle whether a pet is discarded and return its new state. */
export async function toggleDislike(
  adopterId: string,
  petId: string,
): Promise<{ disliked: boolean }> {
  const dislikes = await readDislikes();
  const exists = dislikes.some(
    (d) => d.adopterId === adopterId && d.petId === petId,
  );
  if (exists) {
    await writeDislikes(
      dislikes.filter((d) => !(d.adopterId === adopterId && d.petId === petId)),
    );
    return { disliked: false };
  }
  await writeDislikes([
    ...dislikes,
    { adopterId, petId, createdAt: new Date().toISOString() },
  ]);
  return { disliked: true };
}

/** Set an explicit visibility preference without undoing an already-saved choice. */
export async function setPetHidden(
  adopterId: string,
  petId: string,
  hidden: boolean,
): Promise<{ disliked: boolean }> {
  const dislikes = await readDislikes();
  const exists = dislikes.some(
    (item) => item.adopterId === adopterId && item.petId === petId,
  );
  if (exists === hidden) return { disliked: hidden };
  await writeDislikes(
    hidden
      ? [...dislikes, { adopterId, petId, createdAt: new Date().toISOString() }]
      : dislikes.filter(
          (item) => item.adopterId !== adopterId || item.petId !== petId,
        ),
  );
  return { disliked: hidden };
}

/** Remove an adopter's discard preferences during account deletion. */
export async function deleteDislikesOfUser(adopterId: string): Promise<void> {
  const dislikes = await readDislikes();
  await writeDislikes(dislikes.filter((d) => d.adopterId !== adopterId));
}
