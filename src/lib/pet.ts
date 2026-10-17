import type { UploadedFile } from "./ngo";

/** Client-safe pet model persisted in pets.json, linked to its publishing NGO by ngoId. */

export type PetSpecies = "dog" | "cat" | "bird" | "other";

export const PET_SPECIES_LABEL: Record<PetSpecies, string> = {
  dog: "Cachorro",
  cat: "Gato",
  bird: "Pássaro",
  other: "Outro",
};

export const PET_SPECIES_KEYS = Object.keys(PET_SPECIES_LABEL) as PetSpecies[];

export type PetSex = "male" | "female";

export const PET_SEX_LABEL: Record<PetSex, string> = {
  male: "Macho",
  female: "Fêmea",
};

export type PetSize = "small" | "medium" | "large";

export const PET_SIZE_LABEL: Record<PetSize, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
};

export type PetAgeGroup = "young" | "adult" | "senior";

export const PET_AGE_GROUP_LABEL: Record<PetAgeGroup, string> = {
  young: "Filhote",
  adult: "Adulto",
  senior: "Idoso",
};

export type PetStatus = "available" | "in_progress" | "adopted" | "unavailable";

export const PET_STATUS_LABEL: Record<PetStatus, string> = {
  available: "Disponível",
  in_progress: "Em processo de adoção",
  adopted: "Adotado",
  unavailable: "Indisponível",
};

export type PetHealth = {
  vaccinated: boolean;
  neutered: boolean;
  dewormed: boolean;
  /** Special needs or ongoing care requirements. */
  specialNeeds: string;
};

export type Pet = {
  id: string;
  /** Identifier of the NGO that published this pet. */
  ngoId: string;
  name: string;
  species: PetSpecies;
  /** Optional breed; mixed-breed pets are valid. */
  breed: string;
  sex: PetSex;
  size: PetSize;
  /** Optional approximate size in centimeters. */
  sizeCm?: number | null;
  ageGroup: PetAgeGroup;
  temperament: string[];
  health: PetHealth;
  description: string;
  photos: UploadedFile[];
  status: PetStatus;
  /** Hide from published listings without deleting the pet's history. */
  archived: boolean;
  /** Views are visible only to the publishing NGO; adopters see like counts. */
  views: number;
  /** ISO timestamp. */
  createdAt: string;
  updatedAt: string;
};

/** Pet-creation fields; identifiers, status, ownership, and timestamps are derived. */
export type PetInput = {
  name: string;
  species: PetSpecies;
  breed: string;
  sex: PetSex;
  size: PetSize;
  sizeCm?: number | null;
  ageGroup: PetAgeGroup;
  temperament: string[];
  health: PetHealth;
  description: string;
  photos: UploadedFile[];
};

export function createEmptyPetInput(): PetInput {
  return {
    name: "",
    species: "dog",
    breed: "",
    sex: "male",
    size: "medium",
    sizeCm: null,
    ageGroup: "adult",
    temperament: [],
    health: {
      vaccinated: false,
      neutered: false,
      dewormed: false,
      specialNeeds: "",
    },
    description: "",
    photos: [],
  };
}

/** First required-field error, or null when valid. */
export function validatePetInput(input: PetInput): string | null {
  if (!input.name.trim()) return "Dê um nome para o pet.";
  if (input.photos.length === 0) return "Adicione ao menos uma foto.";
  if (!input.description.trim()) return "Escreva uma descrição do pet.";
  if (
    input.sizeCm != null &&
    (!Number.isFinite(input.sizeCm) || input.sizeCm <= 0 || input.sizeCm > 300)
  )
    return "Informe um tamanho em centímetros entre 1 e 300.";
  return null;
}

/** Pet-edit fields extend creation fields with adoption status. */
export type PetUpdateInput = PetInput & { status: PetStatus };
