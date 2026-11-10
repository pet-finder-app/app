/** Presentation statuses used by the shared animal feed. */
export type PetStatus = "available" | "in_progress" | "adopted" | "unavailable";
export const PET_STATUS_LABEL: Record<PetStatus, string> = {
  available: "Disponível",
  in_progress: "Em processo de adoção",
  adopted: "Adotado",
  unavailable: "Indisponível",
};
export type Pet = {
  id: string;
  name: string;
  description: string;
  status: PetStatus;
};
