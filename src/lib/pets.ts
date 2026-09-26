import { promises as fs } from "node:fs";
import path from "node:path";
import type { Pet, PetInput, PetUpdateInput } from "./pet";
import { readUsers } from "./users";

/**
 * Camada de acesso aos pets — hoje um arquivo JSON, amanhã o backend. Só
 * este arquivo precisa mudar quando a API real entrar (ver `lib/users.ts`).
 */

const PETS_FILE = path.join(process.cwd(), "src", "data", "pets.json");

export async function readPets(): Promise<Pet[]> {
  const raw = await fs.readFile(PETS_FILE, "utf-8");
  return (JSON.parse(raw) as { pets: Pet[] }).pets;
}

async function writePets(pets: Pet[]): Promise<void> {
  await fs.writeFile(
    PETS_FILE,
    JSON.stringify({ pets }, null, 2) + "\n",
    "utf-8",
  );
}

export async function listPetsByOng(ongId: string): Promise<Pet[]> {
  const pets = await readPets();
  return pets.filter((pet) => pet.ongId === ongId);
}

/** Só retorna o pet se ele pertencer a essa ONG. */
export async function getPetByIdAndOng(
  id: string,
  ongId: string,
): Promise<Pet | undefined> {
  const pets = await readPets();
  return pets.find((pet) => pet.id === id && pet.ongId === ongId);
}

export async function getPetById(id: string): Promise<Pet | undefined> {
  const pets = await readPets();
  return pets.find((pet) => pet.id === id);
}

/**
 * Feed do adotante: pets disponíveis publicados por ONGs verificadas, mais
 * recentes primeiro.
 */
export async function listAvailablePets(): Promise<Pet[]> {
  const [pets, users] = await Promise.all([readPets(), readUsers()]);
  const verifiedOngIds = new Set(
    users
      .filter(
        (user) =>
          user.role === "ong" && user.ong?.verification.status === "verificada",
      )
      .map((user) => user.id),
  );

  return pets
    .filter(
      (pet) =>
        pet.status === "disponivel" &&
        !pet.archived &&
        verifiedOngIds.has(pet.ongId),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createPet(ongId: string, input: PetInput): Promise<Pet> {
  const pets = await readPets();
  const now = new Date().toISOString();

  const pet: Pet = {
    ...input,
    id: crypto.randomUUID(),
    ongId,
    status: "disponivel",
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  await writePets([...pets, pet]);
  return pet;
}

/** Retorna undefined se o pet não existir ou não pertencer a essa ONG. */
export async function updatePet(
  id: string,
  ongId: string,
  input: PetUpdateInput,
): Promise<Pet | undefined> {
  const pets = await readPets();
  const index = pets.findIndex((p) => p.id === id && p.ongId === ongId);
  if (index === -1) return undefined;

  const updated: Pet = {
    ...pets[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  pets[index] = updated;
  await writePets(pets);
  return updated;
}

/** Retorna undefined se o pet não existir ou não pertencer a essa ONG. */
export async function setPetArchived(
  id: string,
  ongId: string,
  archived: boolean,
): Promise<Pet | undefined> {
  const pets = await readPets();
  const index = pets.findIndex((p) => p.id === id && p.ongId === ongId);
  if (index === -1) return undefined;

  const updated: Pet = {
    ...pets[index],
    archived,
    updatedAt: new Date().toISOString(),
  };
  pets[index] = updated;
  await writePets(pets);
  return updated;
}
