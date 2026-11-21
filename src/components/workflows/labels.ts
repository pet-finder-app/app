/** Portuguese labels for Go's agreement, follow-up and surrender enums. */
export const AGREEMENT_KIND_LABELS: Record<string, string> = {
  adoption: "Termo de adoção",
  surrender: "Termo de entrega ou devolução",
};
export const PLACEHOLDER_LABELS: Record<string, string> = {
  user_name: "Nome do adotante ou de quem entrega o animal",
  organization_name: "Nome da ONG",
  animal_name: "Nome do animal",
  representative_name: "Nome do representante da ONG",
  date: "Data de criação do termo (AAAA-MM-DD)",
};
export const FOLLOWUP_STATUS_LABELS: Record<string, string> = {
  scheduled: "Aguardando relato",
  submitted: "Relato enviado, em análise",
  changes_requested: "Ajustes solicitados",
  closed: "Encerrado",
  cancelled: "Cancelado pela ONG",
};
export const FOLLOWUP_DECISION_LABELS: Record<string, string> = {
  closed: "Acompanhamento encerrado",
  changes_requested: "Ajustes solicitados",
};
export const WELFARE_LABELS: Record<string, string> = {
  good: "Bem-estar bom",
  needs_attention: "Precisa de atenção",
  urgent: "Urgente",
};
export const SURRENDER_KIND_LABELS: Record<string, string> = {
  intake: "Entrega de animal à ONG",
  return: "Devolução de animal adotado",
};
export const SURRENDER_STATUS_LABELS: Record<string, string> = {
  submitted: "Solicitação enviada",
  needs_information: "Mais informações necessárias",
  accepted: "Aceita pela ONG",
  rejected: "Recusada",
  cancelled: "Cancelada",
  completed: "Concluída",
};
/** History actions recorded by Go: statuses plus handover confirmations. */
export const SURRENDER_ACTION_LABELS: Record<string, string> = {
  submitted: "Solicitação enviada",
  resubmitted: "Informações reenviadas",
  needs_information: "ONG pediu mais informações",
  accepted: "ONG aceitou a solicitação",
  rejected: "ONG recusou a solicitação",
  cancelled: "Solicitação cancelada",
  delivery: "Entrega do animal confirmada pelo solicitante",
  receipt: "Recebimento do animal confirmado pela ONG",
};
export const SPECIES_LABELS: Record<string, string> = {
  dog: "Cachorro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Coelho",
  reptile: "Réptil",
  small_mammal: "Pequeno mamífero",
  other: "Outro",
};
export const SEX_LABELS: Record<string, string> = {
  female: "Fêmea",
  male: "Macho",
  unknown: "Não sei",
};
export const SIZE_LABELS: Record<string, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  extra_large: "Muito grande",
};
export const options = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
/** Media ids from Go, read through the authenticated proxy. */
export const mediaIdHref = (id: string) =>
  `/api/backend/v1/media/${encodeURIComponent(id)}`;
