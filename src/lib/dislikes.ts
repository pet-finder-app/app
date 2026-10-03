import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Pets que o adotante marcou como "Não tenho interesse". Hoje um arquivo
 * JSON, amanhã o backend — só este arquivo muda (ver `lib/follows.ts`).
 */

export type Dislike = {
  adopterId: string;
  petId: string;
  /** ISO datetime. */
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

/** IDs dos pets descartados pelo adotante, mais recentes primeiro. */
export async function listDislikedPetIds(adopterId: string): Promise<string[]> {
  const dislikes = await readDislikes();
  return dislikes
    .filter((d) => d.adopterId === adopterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((d) => d.petId);
}

/** Alterna "Não tenho interesse". Retorna se o pet agora está descartado. */
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

/** Apaga os descartes do adotante (exclusão de conta). */
export async function deleteDislikesOfUser(adopterId: string): Promise<void> {
  const dislikes = await readDislikes();
  await writeDislikes(dislikes.filter((d) => d.adopterId !== adopterId));
}
