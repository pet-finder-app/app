import { ANIMAL_STATUS_LABELS } from "@/components/backend/labels";
import {
  animalSpeciesSchema,
  type AnimalSpecies,
  type EnergyLevel,
} from "@/lib/api/animals";

export const SPECIES_LABELS: Record<AnimalSpecies, string> = {
  dog: "Cão",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Coelho",
  reptile: "Réptil",
  small_mammal: "Pequeno mamífero",
  other: "Outro",
};
export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};
export const SIZE_LABELS: Record<string, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  extra_large: "Muito grande",
};
/** Animal lifecycle states, including the archived state set by Go. */
export const LIFECYCLE_STATUS_LABELS: Record<string, string> = {
  ...ANIMAL_STATUS_LABELS,
  archived: "Arquivado",
};
export const HISTORY_ACTION_LABELS: Record<string, string> = {
  archive: "Arquivado",
  delete: "Excluído",
  organization_assignment: "ONG responsável alterada",
};
export function speciesLabel(value: string): string {
  const species = animalSpeciesSchema.safeParse(value);
  return species.success ? SPECIES_LABELS[species.data] : "Não informada";
}
