import { promises as fs } from "node:fs";
import path from "node:path";
import type { Pet, PetInput, PetStatus, PetUpdateInput } from "./pet";
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

export async function createPet(
  ongId: string,
  input: PetInput,
  status: PetStatus = "disponivel",
): Promise<Pet> {
  const pets = await readPets();
  const now = new Date().toISOString();

  const pet: Pet = {
    ...input,
    id: crypto.randomUUID(),
    ongId,
    status,
    archived: false,
    views: 0,
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

/** Apaga o pet de vez. Retorna false se ele não existir ou não pertencer a essa ONG. */
export async function deletePet(id: string, ongId: string): Promise<boolean> {
  const pets = await readPets();
  const index = pets.findIndex((p) => p.id === id && p.ongId === ongId);
  if (index === -1) return false;

  pets.splice(index, 1);
  await writePets(pets);
  return true;
}

/** Muda só o status do pet (usado pelo processo de adoção). */
export async function setPetStatus(
  id: string,
  status: PetStatus,
): Promise<void> {
  const pets = await readPets();
  const index = pets.findIndex((p) => p.id === id);
  if (index === -1) return;
  pets[index] = {
    ...pets[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  await writePets(pets);
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

export type PetOngInfo = {
  id: string;
  name: string;
  nickname: string;
  logoUrl: string | null;
  city: string;
  cep: string;
};

/** Nome e cidade da ONG de cada pet, para mostrar nos cards e no detalhe. */
export async function getOngInfoMap(): Promise<Map<string, PetOngInfo>> {
  const users = await readUsers();
  const map = new Map<string, PetOngInfo>();
  for (const user of users) {
    if (user.role !== "ong" || !user.ong) continue;
    const { address } = user.ong.legal;
    map.set(user.id, {
      id: user.id,
      nickname: user.ong.legal.nickname,
      logoUrl: user.ong.publicProfile.logo?.url ?? null,
      name: user.ong.legal.tradeName || user.name,
      cep: address.cep,
      city: [address.city, address.state].filter(Boolean).join("/"),
    });
  }
  return map;
}

/**
 * A ONG marca o pet como "Indisponível" (desistiu de oferecê-lo) ou volta a
 * "Disponível". Só vale enquanto o pet está num desses dois estados — "Em
 * processo" e "Adotado" mudam pelo processo de adoção. Retorna `undefined` se
 * o pet não for dessa ONG e `"locked"` se o estado não puder mudar agora.
 */
export async function setPetStatusByOng(
  id: string,
  ongId: string,
  status: "disponivel" | "indisponivel",
): Promise<Pet | "locked" | undefined> {
  const pets = await readPets();
  const index = pets.findIndex((p) => p.id === id && p.ongId === ongId);
  if (index === -1) return undefined;
  const current = pets[index].status;
  if (current !== "disponivel" && current !== "indisponivel") return "locked";

  const updated: Pet = {
    ...pets[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  pets[index] = updated;
  await writePets(pets);
  return updated;
}

/** Apaga todos os pets de uma ONG (exclusão de conta). */
export async function deletePetsByOng(ongId: string): Promise<void> {
  const pets = await readPets();
  await writePets(pets.filter((p) => p.ongId !== ongId));
}
