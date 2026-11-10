export const ANIMAL_STATUS_LABELS: Record<string, string> = {
  available: "Disponível",
  pending_organization: "Aguardando a ONG",
  adoption_in_progress: "Em adoção",
  adopted: "Adotado",
  unavailable: "Indisponível",
  under_review: "Em análise",
};
export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  submitted: "Pedido enviado",
  screening: "Triagem",
  more_information_requested: "Mais informações necessárias",
  approved: "Aprovado",
  rejected: "Recusado",
  withdrawn: "Desistência",
  completed: "Concluído",
  cancelled: "Cancelado",
};
export const VERIFICATION_LABELS: Record<string, string> = {
  pending: "Em análise",
  verified: "ONG verificada",
  rejected: "Cadastro recusado",
  suspended: "Suspensa",
};
export function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("pt-BR") : "Não informado";
}
