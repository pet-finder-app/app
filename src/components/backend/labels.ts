export const ANIMAL_STATUS_LABELS: Record<string, string> = {
  available: "Disponível",
  pending_organization: "Aguardando a ONG",
  adoption_in_progress: "Em adoção",
  adopted: "Adotado",
  unavailable: "Indisponível",
  under_review: "Em análise",
  archived: "Arquivado",
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
export const PERSONAL_VERIFICATION_LABELS: Record<string, string> = {
  unverified: "Identidade não verificada",
  pending: "Verificação em análise",
  verified: "Identidade verificada",
  rejected: "Verificação recusada",
};
export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  submitted: "Enviada",
  under_review: "Em análise",
  approved: "Aprovada",
  rejected: "Recusada",
};
export const DOCUMENT_LABELS: Record<string, string> = {
  identity_document: "Documento de identidade com foto",
  organization_registration:
    "Comprovante de registro da ONG (CNPJ ou estatuto)",
  representative_identity: "Documento de identidade do representante legal",
};
/** Private documents are served by Go and read through the authenticated proxy. */
export function documentHref(url: string): string {
  const match = /\/v1\/media\/([0-9a-f-]{36})$/i.exec(url);
  return match ? `/api/backend/v1/media/${match[1]}` : url;
}
/** Same as documentHref: any Go media URL, public or private, via the proxy. */
export const mediaHref = documentHref;
