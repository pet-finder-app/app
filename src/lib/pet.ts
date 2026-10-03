import type { UploadedFile } from "./ong";

/**
 * Modelo de dados do pet publicado por uma ONG. Fica em `pets.json` — o
 * backend pode virar uma tabela própria depois, ligada à ONG por `ongId`.
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

export type PetSpecies = "cachorro" | "gato" | "passaro" | "outro";

export const PET_SPECIES_LABEL: Record<PetSpecies, string> = {
  cachorro: "Cachorro",
  gato: "Gato",
  passaro: "Pássaro",
  outro: "Outro",
};

export const PET_SPECIES_KEYS = Object.keys(PET_SPECIES_LABEL) as PetSpecies[];

export type PetSex = "macho" | "femea";

export const PET_SEX_LABEL: Record<PetSex, string> = {
  macho: "Macho",
  femea: "Fêmea",
};

export type PetSize = "pequeno" | "medio" | "grande";

export const PET_SIZE_LABEL: Record<PetSize, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

export type PetAgeGroup = "filhote" | "adulto" | "idoso";

export const PET_AGE_GROUP_LABEL: Record<PetAgeGroup, string> = {
  filhote: "Filhote",
  adulto: "Adulto",
  idoso: "Idoso",
};

export type PetStatus =
  "disponivel" | "em_processo" | "adotado" | "indisponivel";

export const PET_STATUS_LABEL: Record<PetStatus, string> = {
  disponivel: "Disponível",
  em_processo: "Em processo de adoção",
  adotado: "Adotado",
  indisponivel: "Indisponível",
};

export type PetHealth = {
  vaccinated: boolean;
  neutered: boolean;
  dewormed: boolean;
  /** Necessidades especiais ou cuidados contínuos, se houver. */
  specialNeeds: string;
};

export type Pet = {
  id: string;
  /** `StoredUser.id` da ONG que publicou. */
  ongId: string;
  name: string;
  species: PetSpecies;
  /** Opcional — vira-lata também é uma resposta válida. */
  breed: string;
  sex: PetSex;
  size: PetSize;
  /** Tamanho aproximado em centímetros — opcional. */
  sizeCm?: number | null;
  ageGroup: PetAgeGroup;
  temperament: string[];
  health: PetHealth;
  description: string;
  photos: UploadedFile[];
  status: PetStatus;
  /** Some da lista de publicados sem apagar o histórico do pet. */
  archived: boolean;
  /** Só a ONG que publicou vê esse número — os adotantes só veem curtidas. */
  views: number;
  /** ISO datetime. */
  createdAt: string;
  updatedAt: string;
};

/** O que a tela de cadastro coleta. O resto (id, ongId, status, datas) é derivado. */
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
    species: "cachorro",
    breed: "",
    sex: "macho",
    size: "medio",
    sizeCm: null,
    ageGroup: "adulto",
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

/** Mensagem do primeiro campo obrigatório que falta, ou null se tudo certo. */
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

/** O que a tela de edição envia — os mesmos campos do cadastro, mais o status. */
export type PetUpdateInput = PetInput & { status: PetStatus };
