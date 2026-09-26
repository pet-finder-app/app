import type { DocumentType } from "./br-documents";

/**
 * Modelo de dados da ONG, em seis camadas. Tudo fica dentro de
 * `StoredUser.ong` no users.json — o backend pode quebrar em tabelas depois.
 *
 * Só o que está em `OngSignupInput` é pedido na tela de cadastro. O resto é
 * preenchido em /ong/perfil/editar e exigido apenas na hora de publicar o
 * primeiro pet (ver `getOngChecklist`).
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

// ---------------------------------------------------------------------------
// 1. Identificação jurídica
// ---------------------------------------------------------------------------

export type OrganizationType =
  | "associacao"
  | "ong_formalizada"
  | "abrigo_particular"
  | "protetor_independente"
  | "lar_temporario";

export type OrganizationTypeInfo = {
  label: string;
  description: string;
  /** Define se o cadastro pede CNPJ (pessoa jurídica) ou CPF (pessoa física). */
  documentType: DocumentType;
};

export const ORGANIZATION_TYPES: Record<
  OrganizationType,
  OrganizationTypeInfo
> = {
  associacao: {
    label: "Associação",
    description: "Associação civil registrada em cartório.",
    documentType: "cnpj",
  },
  ong_formalizada: {
    label: "ONG formalizada",
    description: "Organização com CNPJ ativo.",
    documentType: "cnpj",
  },
  abrigo_particular: {
    label: "Abrigo particular",
    description: "Abrigo mantido por uma pessoa física, sem CNPJ.",
    documentType: "cpf",
  },
  protetor_independente: {
    label: "Protetor(a) independente",
    description: "Resgata e cuida de animais por conta própria.",
    documentType: "cpf",
  },
  lar_temporario: {
    label: "Grupo de lar temporário",
    description: "Rede informal de lares temporários.",
    documentType: "cpf",
  },
};

export const ORGANIZATION_TYPE_KEYS = Object.keys(
  ORGANIZATION_TYPES,
) as OrganizationType[];

export function isOrganizationType(value: unknown): value is OrganizationType {
  return typeof value === "string" && value in ORGANIZATION_TYPES;
}

export type Address = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  /** UF, ex.: "SP". */
  state: string;
};

/** "Rua X, 100 - Bairro, Cidade/UF", pulando o que não foi preenchido. */
export function formatAddress(address: Address): string {
  const street = [address.street, address.number].filter(Boolean).join(", ");
  const cityState = [address.city, address.state].filter(Boolean).join("/");
  return [street, address.neighborhood, cityState].filter(Boolean).join(" - ");
}

/** Situação cadastral na Receita — preenchido pelo backend após a consulta. */
export type ReceitaStatus = "nao_consultado" | "ativa" | "inativa" | "erro";

export type OngLegal = {
  organizationType: OrganizationType;
  documentType: DocumentType;
  /** Só dígitos. */
  document: string;
  receitaStatus: ReceitaStatus;
  /** Razão social (CNPJ) ou nome completo (CPF). */
  legalName: string;
  /** Nome fantasia — como a ONG é conhecida. */
  tradeName: string;
  /** RG, só para pessoa física. */
  rg: string;
  /** ISO date (YYYY-MM-DD). */
  foundedAt: string;
  address: Address;
};

// ---------------------------------------------------------------------------
// Arquivos: o front só guarda os metadados; o upload real fica para o backend.
// ---------------------------------------------------------------------------

export type UploadedFile = {
  name: string;
  size: number;
  mimeType: string;
  /** ISO datetime. */
  uploadedAt: string;
  /** URL definitiva, quando o backend fizer o upload. */
  url: string | null;
};

// ---------------------------------------------------------------------------
// 2. Responsável legal
// ---------------------------------------------------------------------------

export type OngRepresentative = {
  fullName: string;
  /** Só dígitos. */
  cpf: string;
  position: string;
  email: string;
  /** Só dígitos, com DDD. */
  phone: string;
  /** ISO datetime da confirmação por código, ou null. */
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  idDocument: UploadedFile | null;
};

// ---------------------------------------------------------------------------
// 3. Verificação e confiança
// ---------------------------------------------------------------------------

export type VerificationStatus =
  "pendente" | "em_analise" | "verificada" | "suspensa";

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  pendente: "Cadastro pendente",
  em_analise: "Em análise",
  verificada: "ONG verificada",
  suspensa: "Suspensa",
};

export type OngVerification = {
  status: VerificationStatus;
  /** ISO datetime da última mudança de status. */
  statusUpdatedAt: string;
  /** Motivo, quando suspensa ou recusada. */
  statusNote: string;
  /** Estatuto social ou ata de fundação (PDF). */
  bylaws: UploadedFile | null;
  /** Comprovante de endereço da sede/abrigo. */
  addressProof: UploadedFile | null;
  /** Registro municipal/estadual de proteção animal, se houver. */
  animalProtectionRegistry: string;
  /** CRMV do veterinário parceiro, se houver. */
  veterinarianCrmv: string;
  /** Pessoa física: referências de ONGs já cadastradas (nomes ou contatos). */
  references: string[];
};

// ---------------------------------------------------------------------------
// 4. Dados operacionais
// ---------------------------------------------------------------------------

export type Species = "caes" | "gatos" | "outros";

export const SPECIES_LABEL: Record<Species, string> = {
  caes: "Cães",
  gatos: "Gatos",
  outros: "Outros",
};

export type PreferredContact = "whatsapp" | "telefone" | "email" | "instagram";

export const PREFERRED_CONTACT_LABEL: Record<PreferredContact, string> = {
  whatsapp: "WhatsApp",
  telefone: "Telefone",
  email: "E-mail",
  instagram: "Instagram",
};

export type TeamRole = "admin" | "cadastra_pet" | "aprova_adocao";

export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  admin: "Administrador",
  cadastra_pet: "Cadastra pets",
  aprova_adocao: "Aprova adoções",
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  roles: TeamRole[];
  /** ISO datetime do convite. */
  invitedAt: string;
};

export type OngOperations = {
  shelterCapacity: number | null;
  currentAnimals: number | null;
  species: Species[];
  /** Cidades/bairros onde entrega animais. */
  serviceAreas: string[];
  homeVisit: boolean;
  requiresContract: boolean;
  chargesAdoptionFee: boolean;
  /** Em reais; null quando não cobra. */
  adoptionFee: number | null;
  contactHours: string;
  preferredContact: PreferredContact;
  team: TeamMember[];
};

// ---------------------------------------------------------------------------
// 5. Perfil público
// ---------------------------------------------------------------------------

export type OngDonation = {
  pixKey: string;
  bankAccount: string;
  neededItems: string[];
};

export type OngPublicProfile = {
  logo: UploadedFile | null;
  photos: UploadedFile[];
  /** Descrição/missão. */
  description: string;
  website: string;
  instagram: string;
  facebook: string;
  donation: OngDonation;
  /** Adotantes que seguem a ONG no app. */
  followersCount: number;
};

// ---------------------------------------------------------------------------
// 6. Jurídico e LGPD
// ---------------------------------------------------------------------------

export type TermsAcceptance = {
  /** Versão do texto aceito — ver `TERMS_VERSION`. */
  version: string;
  /** ISO datetime. */
  acceptedAt: string;
  ip: string;
  userAgent: string;
};

export type OngLegalConsent = {
  terms: TermsAcceptance;
  /** Modelo de termo de adoção da ONG (vai ser padronizado no futuro). */
  adoptionTermTemplate: UploadedFile | null;
  /** Consentimento para tratar dados dos adotantes que chegam pelo app. */
  adoptersDataConsent: TermsAcceptance | null;
};

/** Versão atual dos termos em /termos. Mude quando o texto mudar. */
export const TERMS_VERSION = "2026-09-26-rascunho";

// ---------------------------------------------------------------------------
// Perfil completo
// ---------------------------------------------------------------------------

export type OngProfile = {
  legal: OngLegal;
  representative: OngRepresentative;
  verification: OngVerification;
  operations: OngOperations;
  publicProfile: OngPublicProfile;
  legalConsent: OngLegalConsent;
};

/** O que a tela de cadastro coleta. O resto vem depois. */
export type OngSignupInput = {
  organizationType: OrganizationType;
  /** Só dígitos. */
  document: string;
  tradeName: string;
  email: string;
  terms: TermsAcceptance;
};

export function createEmptyOngProfile(input: OngSignupInput): OngProfile {
  const now = new Date().toISOString();
  return {
    legal: {
      organizationType: input.organizationType,
      documentType: ORGANIZATION_TYPES[input.organizationType].documentType,
      document: input.document,
      receitaStatus: "nao_consultado",
      legalName: "",
      tradeName: input.tradeName,
      rg: "",
      foundedAt: "",
      address: {
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
    },
    representative: {
      fullName: "",
      cpf: "",
      position: "",
      email: input.email,
      phone: "",
      emailVerifiedAt: null,
      phoneVerifiedAt: null,
      idDocument: null,
    },
    verification: {
      status: "pendente",
      statusUpdatedAt: now,
      statusNote: "",
      bylaws: null,
      addressProof: null,
      animalProtectionRegistry: "",
      veterinarianCrmv: "",
      references: [],
    },
    operations: {
      shelterCapacity: null,
      currentAnimals: null,
      species: [],
      serviceAreas: [],
      homeVisit: false,
      requiresContract: false,
      chargesAdoptionFee: false,
      adoptionFee: null,
      contactHours: "",
      preferredContact: "whatsapp",
      team: [],
    },
    publicProfile: {
      logo: null,
      photos: [],
      description: "",
      website: "",
      instagram: "",
      facebook: "",
      donation: { pixKey: "", bankAccount: "", neededItems: [] },
      followersCount: 0,
    },
    legalConsent: {
      terms: input.terms,
      adoptionTermTemplate: null,
      adoptersDataConsent: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Checklist: o que falta para publicar o primeiro pet
// ---------------------------------------------------------------------------

export type OngProfileSection =
  | "legal"
  | "representative"
  | "verification"
  | "operations"
  | "publicProfile"
  | "legalConsent";

export const SECTION_LABEL: Record<OngProfileSection, string> = {
  legal: "Identificação",
  representative: "Responsável legal",
  verification: "Verificação",
  operations: "Como você atua",
  publicProfile: "Perfil público",
  legalConsent: "Termos e LGPD",
};

export const SECTION_KEYS = Object.keys(SECTION_LABEL) as OngProfileSection[];

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  /** Seção de /ong/perfil/editar onde o item é preenchido. */
  section: OngProfileSection;
};

export function getOngChecklist(profile: OngProfile): ChecklistItem[] {
  const {
    legal,
    representative,
    verification,
    operations,
    publicProfile,
    legalConsent,
  } = profile;
  const isCompany = legal.documentType === "cnpj";
  const addressDone = Boolean(
    legal.address.cep &&
    legal.address.street &&
    legal.address.city &&
    legal.address.state,
  );

  return [
    {
      id: "legal-name",
      label: isCompany
        ? "Razão social e data de fundação"
        : "Nome completo, RG e data de início",
      done: Boolean(
        legal.legalName && legal.foundedAt && (isCompany || legal.rg),
      ),
      section: "legal",
    },
    {
      id: "address",
      label: "Endereço completo com CEP",
      done: addressDone,
      section: "legal",
    },
    {
      id: "representative",
      label: "Nome, CPF, cargo e telefone do responsável",
      done: Boolean(
        representative.fullName &&
        representative.cpf &&
        representative.position &&
        representative.phone,
      ),
      section: "representative",
    },
    {
      id: "representative-id",
      label: "Documento com foto do responsável",
      done: representative.idDocument !== null,
      section: "representative",
    },
    {
      id: "bylaws",
      label: isCompany
        ? "Estatuto social ou ata de fundação"
        : "Referências de ONGs já cadastradas",
      done: isCompany
        ? verification.bylaws !== null
        : verification.references.length > 0,
      section: "verification",
    },
    {
      id: "address-proof",
      label: "Comprovante de endereço da sede/abrigo",
      done: verification.addressProof !== null,
      section: "verification",
    },
    {
      id: "operations",
      label: "Espécies atendidas e área de atuação",
      done: operations.species.length > 0 && operations.serviceAreas.length > 0,
      section: "operations",
    },
    {
      id: "public",
      label: "Descrição da ONG",
      done: publicProfile.description.trim().length > 0,
      section: "publicProfile",
    },
    {
      id: "adopters-consent",
      label: "Consentimento para tratar dados dos adotantes",
      done: legalConsent.adoptersDataConsent !== null,
      section: "legalConsent",
    },
  ];
}

/** Pode pedir análise (e, depois de verificada, publicar pets)? */
export function isOngReadyForReview(profile: OngProfile): boolean {
  return getOngChecklist(profile).every((item) => item.done);
}
