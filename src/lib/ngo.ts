import type { DocumentType } from "./br-documents";

/** Client-safe NGO profile model persisted under StoredUser.ngo. Signup collects only initial identity; profile completion and administrative review precede publication. */

// ---------------------------------------------------------------------------
// 1. Organization identification.
// ---------------------------------------------------------------------------

export type OrganizationType =
  | "association"
  | "registered_ngo"
  | "private_shelter"
  | "independent_rescuer"
  | "foster_network";

export type OrganizationTypeInfo = {
  label: string;
  description: string;
  /** Select the Brazilian company or personal document type required for this account. */
  documentType: DocumentType;
};

export const ORGANIZATION_TYPES: Record<
  OrganizationType,
  OrganizationTypeInfo
> = {
  association: {
    label: "Associação",
    description: "Associação civil registrada em cartório.",
    documentType: "companyTaxId",
  },
  registered_ngo: {
    label: "ONG formalizada",
    description: "Organização com CNPJ ativo.",
    documentType: "companyTaxId",
  },
  private_shelter: {
    label: "Abrigo particular",
    description: "Abrigo mantido por uma pessoa física, sem CNPJ.",
    documentType: "personalTaxId",
  },
  independent_rescuer: {
    label: "Protetor(a) independente",
    description: "Resgata e cuida de animais por conta própria.",
    documentType: "personalTaxId",
  },
  foster_network: {
    label: "Grupo de lar temporário",
    description: "Rede informal de lares temporários.",
    documentType: "personalTaxId",
  },
};

export const ORGANIZATION_TYPE_KEYS = Object.keys(
  ORGANIZATION_TYPES,
) as OrganizationType[];

/** Individuals use personal accounts to request NGO assistance. */
export const NGO_SIGNUP_TYPE_KEYS = ["association", "registered_ngo"] as const;

export function isNgoSignupType(
  value: unknown,
): value is (typeof NGO_SIGNUP_TYPE_KEYS)[number] {
  return NGO_SIGNUP_TYPE_KEYS.some((type) => type === value);
}

export function isOrganizationType(value: unknown): value is OrganizationType {
  return typeof value === "string" && value in ORGANIZATION_TYPES;
}

export type Address = {
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  /** Brazilian state abbreviation, such as SP. */
  state: string;
};

/** Format street, number, neighborhood, city, and state, omitting empty parts. */
export function formatAddress(address: Address): string {
  const street = [address.street, address.number].filter(Boolean).join(", ");
  const cityState = [address.city, address.state].filter(Boolean).join("/");
  return [street, address.neighborhood, cityState].filter(Boolean).join(" - ");
}

/** Tax-registry status populated by a backend lookup. */
export type TaxRegistryStatus = "not_checked" | "active" | "inactive" | "error";

export type NgoLegal = {
  organizationType: OrganizationType;
  documentType: DocumentType;
  /** Digits only. */
  document: string;
  taxRegistryStatus: TaxRegistryStatus;
  /** Registered organization name or full personal name. */
  legalName: string;
  /** Organization's public trading name. */
  tradeName: string;
  /** Unique organization nickname without the leading at-sign. Signup enforces uniqueness without regard to case. */
  nickname: string;
  /** Identity-card number for an individual. */
  identityCardNumber: string;
  /** ISO date (YYYY-MM-DD). */
  foundedAt: string;
  address: Address;
};

/** Three to twenty-four letters, digits, or underscores, without spaces or an at-sign. */
const NICKNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;

/** Trim surrounding spaces and remove leading at-signs. */
export function normalizeNickname(value: string): string {
  return value.trim().replace(/^@+/, "");
}

export function isValidNickname(value: string): boolean {
  return NICKNAME_PATTERN.test(normalizeNickname(value));
}

// ---------------------------------------------------------------------------
// File metadata is stored by the prototype; a production backend handles uploads.
// ---------------------------------------------------------------------------

export type UploadedFile = {
  name: string;
  size: number;
  mimeType: string;
  /** ISO timestamp. */
  uploadedAt: string;
  /** Permanent file URL provided by the upload backend. */
  url: string | null;
};

// ---------------------------------------------------------------------------
// 2. Legal representative.
// ---------------------------------------------------------------------------

export type NgoRepresentative = {
  fullName: string;
  /** Digits only. */
  personalTaxId: string;
  position: string;
  email: string;
  /** Digits only, including area code. */
  phone: string;
  /** ISO timestamp of code verification, or null. */
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  idDocument: UploadedFile | null;
};

// ---------------------------------------------------------------------------
// 3. Verification and trust.
// ---------------------------------------------------------------------------

export type VerificationStatus =
  "pending" | "under_review" | "verified" | "suspended";

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: "Cadastro pendente",
  under_review: "Em análise",
  verified: "ONG verificada",
  suspended: "Suspensa",
};

export type NgoVerification = {
  status: VerificationStatus;
  /** ISO timestamp of the latest status change. */
  statusUpdatedAt: string;
  /** Explanation for suspension or rejection. */
  statusNote: string;
  /** Organization bylaws or incorporation document in PDF format. */
  bylaws: UploadedFile | null;
  /** Organization or shelter address proof. */
  addressProof: UploadedFile | null;
  /** Optional municipal or state animal-protection registration. */
  animalProtectionRegistry: string;
  /** Optional partner veterinarian registration number. */
  veterinarianCrmv: string;
  /** References from registered NGOs for individual applicants. */
  references: string[];
};

// ---------------------------------------------------------------------------
// 4. Operations.
// ---------------------------------------------------------------------------

export type Species = "dogs" | "cats" | "others";

export const SPECIES_LABEL: Record<Species, string> = {
  dogs: "Cães",
  cats: "Gatos",
  others: "Outros",
};

export type PreferredContact = "whatsapp" | "phone" | "email" | "instagram";

export const PREFERRED_CONTACT_LABEL: Record<PreferredContact, string> = {
  whatsapp: "WhatsApp",
  phone: "Telefone",
  email: "E-mail",
  instagram: "Instagram",
};

export type TeamRole = "admin" | "register_pets" | "approve_adoptions";

export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  admin: "Administrador",
  register_pets: "Cadastra pets",
  approve_adoptions: "Aprova adoções",
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  roles: TeamRole[];
  /** ISO invitation timestamp. */
  invitedAt: string;
};

export type NgoOperations = {
  shelterCapacity: number | null;
  currentAnimals: number | null;
  species: Species[];
  /** Cities and neighborhoods served by the organization. */
  serviceAreas: string[];
  homeVisit: boolean;
  requiresContract: boolean;
  chargesAdoptionFee: boolean;
  /** Amount in Brazilian reais; null when no fee is charged. */
  adoptionFee: number | null;
  contactHours: string;
  preferredContact: PreferredContact;
  team: TeamMember[];
};

// ---------------------------------------------------------------------------
// 5. Public profile.
// ---------------------------------------------------------------------------

export type NgoDonation = {
  pixKey: string;
  bankAccount: string;
  neededItems: string[];
};

export type NgoPublicProfile = {
  logo: UploadedFile | null;
  photos: UploadedFile[];
  /** Public description or mission. */
  description: string;
  website: string;
  instagram: string;
  facebook: string;
  donation: NgoDonation;
  /** Number of adopters following the NGO. */
  followersCount: number;
};

// ---------------------------------------------------------------------------
// 6. Legal and privacy consent.
// ---------------------------------------------------------------------------

export type TermsAcceptance = {
  /** Accepted document version; see TERMS_VERSION. */
  version: string;
  /** ISO timestamp. */
  acceptedAt: string;
  ip: string;
  userAgent: string;
};

export type NgoLegalConsent = {
  terms: TermsAcceptance;
  /** Signup declaration of authority to represent the organization; not administrative verification. */
  representativeAuthorization?: TermsAcceptance | null;
  /** NGO adoption-agreement template. */
  adoptionTermTemplate: UploadedFile | null;
  /** Consent to process adopter information received through the app. */
  adoptersDataConsent: TermsAcceptance | null;
};

/** Current terms version. Update whenever the displayed terms change. */
export const TERMS_VERSION = "2026-09-26-rascunho";

// ---------------------------------------------------------------------------
// Complete profile.
// ---------------------------------------------------------------------------

export type NgoProfile = {
  legal: NgoLegal;
  representative: NgoRepresentative;
  verification: NgoVerification;
  operations: NgoOperations;
  publicProfile: NgoPublicProfile;
  legalConsent: NgoLegalConsent;
};

/** Fields collected at signup; remaining profile details are completed later. */
export type NgoSignupInput = {
  organizationType: OrganizationType;
  /** Digits only. */
  document: string;
  tradeName: string;
  /** Nickname without the leading at-sign; see normalizeNickname. */
  nickname: string;
  email: string;
  representativeName?: string;
  representativeAuthorization?: TermsAcceptance;
  terms: TermsAcceptance;
};

export function createEmptyNgoProfile(input: NgoSignupInput): NgoProfile {
  const now = new Date().toISOString();
  return {
    legal: {
      organizationType: input.organizationType,
      documentType: ORGANIZATION_TYPES[input.organizationType].documentType,
      document: input.document,
      taxRegistryStatus: "not_checked",
      legalName: "",
      tradeName: input.tradeName,
      nickname: normalizeNickname(input.nickname),
      identityCardNumber: "",
      foundedAt: "",
      address: {
        postalCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
    },
    representative: {
      fullName: input.representativeName?.trim() ?? "",
      personalTaxId: "",
      position: "",
      email: input.email,
      phone: "",
      emailVerifiedAt: null,
      phoneVerifiedAt: null,
      idDocument: null,
    },
    verification: {
      status: "pending",
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
      representativeAuthorization: input.representativeAuthorization ?? null,
      adoptionTermTemplate: null,
      adoptersDataConsent: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Publication-readiness checklist.
// ---------------------------------------------------------------------------

export type NgoProfileSection =
  | "legal"
  | "representative"
  | "verification"
  | "operations"
  | "publicProfile"
  | "legalConsent";

export const SECTION_LABEL: Record<NgoProfileSection, string> = {
  legal: "Identificação",
  representative: "Responsável legal",
  verification: "Verificação",
  operations: "Como você atua",
  publicProfile: "Perfil público",
  legalConsent: "Termos e LGPD",
};

export const SECTION_KEYS = Object.keys(SECTION_LABEL) as NgoProfileSection[];

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  /** Settings section containing this checklist item. */
  section: NgoProfileSection;
};

export function getNgoChecklist(profile: NgoProfile): ChecklistItem[] {
  const {
    legal,
    representative,
    verification,
    operations,
    publicProfile,
    legalConsent,
  } = profile;
  const isCompany = legal.documentType === "companyTaxId";
  const addressDone = Boolean(
    legal.address.postalCode &&
    legal.address.street &&
    legal.address.city &&
    legal.address.state,
  );

  return [
    {
      id: "legal-name",
      label: isCompany
        ? "Razão social e data de fundação"
        : "Seu nome completo, RG e desde quando atua",
      done: Boolean(
        legal.legalName &&
        legal.foundedAt &&
        (isCompany || legal.identityCardNumber),
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
      label: "Nome, CPF, cargo/função e telefone do responsável",
      done: Boolean(
        representative.fullName &&
        representative.personalTaxId &&
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

/** Whether review may be requested before publication approval. */
export function isNgoReadyForReview(profile: NgoProfile): boolean {
  return getNgoChecklist(profile).every((item) => item.done);
}
