import { promises as fs } from "node:fs";
import path from "node:path";
import type { Pet, PetInput, PetStatus, PetUpdateInput } from "./pet";
import { readUsers } from "./users";

/** Pet persistence adapter. Replace this module when integrating a production API. */

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

export async function listPetsByNgo(ngoId: string): Promise<Pet[]> {
  const pets = await readPets();
  return pets.filter((pet) => pet.ngoId === ngoId);
}

/** Return the pet only when it belongs to the requested NGO. */
export async function getPetByIdAndNgo(
  id: string,
  ngoId: string,
): Promise<Pet | undefined> {
  const pets = await readPets();
  return pets.find((pet) => pet.id === id && pet.ngoId === ngoId);
}

export async function getPetById(id: string): Promise<Pet | undefined> {
  const pets = await readPets();
  return pets.find((pet) => pet.id === id);
}

/** Available pets from verified NGOs, newest first, for the adopter feed. */
export async function listAvailablePets(): Promise<Pet[]> {
  const [pets, users] = await Promise.all([readPets(), readUsers()]);
  const verifiedNgoIds = new Set(
    users
      .filter(
        (user) =>
          user.role === "ngo" && user.ngo?.verification.status === "verified",
      )
      .map((user) => user.id),
  );

  return pets
    .filter(
      (pet) =>
        pet.status === "available" &&
        !pet.archived &&
        verifiedNgoIds.has(pet.ngoId),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createPet(
  ngoId: string,
  input: PetInput,
  status: PetStatus = "available",
): Promise<Pet> {
  const pets = await readPets();
  const now = new Date().toISOString();

  const pet: Pet = {
    ...input,
    id: crypto.randomUUID(),
    ngoId,
    status,
    archived: false,
    views: 0,
    createdAt: now,
    updatedAt: now,
  };

  await writePets([...pets, pet]);
  return pet;
}

/** Return undefined if the pet is missing or belongs to another NGO. */
export async function updatePet(
  id: string,
  ngoId: string,
  input: PetUpdateInput,
): Promise<Pet | undefined> {
  const pets = await readPets();
  const index = pets.findIndex((p) => p.id === id && p.ngoId === ngoId);
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

/** Permanently delete a pet; return false if it is missing or belongs to another NGO. */
export async function deletePet(id: string, ngoId: string): Promise<boolean> {
  const pets = await readPets();
  const index = pets.findIndex((p) => p.id === id && p.ngoId === ngoId);
  if (index === -1) return false;

  pets.splice(index, 1);
  await writePets(pets);
  return true;
}

/** Update only pet status as part of an adoption workflow. */
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

/** Return undefined if the pet is missing or belongs to another NGO. */
export async function setPetArchived(
  id: string,
  ngoId: string,
  archived: boolean,
): Promise<Pet | undefined> {
  const pets = await readPets();
  const index = pets.findIndex((p) => p.id === id && p.ngoId === ngoId);
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

export type PetNgoInfo = {
  id: string;
  name: string;
  nickname: string;
  logoUrl: string | null;
  city: string;
  postalCode: string;
};

/** NGO name and city for pet cards and details. */
export async function getNgoInfoMap(): Promise<Map<string, PetNgoInfo>> {
  const users = await readUsers();
  const map = new Map<string, PetNgoInfo>();
  for (const user of users) {
    if (user.role !== "ngo" || !user.ngo) continue;
    const { address } = user.ngo.legal;
    map.set(user.id, {
      id: user.id,
      nickname: user.ngo.legal.nickname,
      logoUrl: user.ngo.publicProfile.logo?.url ?? null,
      name: user.ngo.legal.tradeName || user.name,
      postalCode: address.postalCode,
      city: [address.city, address.state].filter(Boolean).join("/"),
    });
  }
  return map;
}

/** Toggle pet availability only between available and unavailable. Adoption-controlled states are locked. Return undefined for an ownership mismatch, or locked for a forbidden transition. */
export async function setPetStatusByNgo(
  id: string,
  ngoId: string,
  status: "available" | "unavailable",
): Promise<Pet | "locked" | undefined> {
  const pets = await readPets();
  const index = pets.findIndex((p) => p.id === id && p.ngoId === ngoId);
  if (index === -1) return undefined;
  const current = pets[index].status;
  if (current !== "available" && current !== "unavailable") return "locked";

  const updated: Pet = {
    ...pets[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  pets[index] = updated;
  await writePets(pets);
  return updated;
}

/** Delete all pets belonging to an NGO during account deletion. */
export async function deletePetsByNgo(ngoId: string): Promise<void> {
  const pets = await readPets();
  await writePets(pets.filter((p) => p.ngoId !== ngoId));
}
