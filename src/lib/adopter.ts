import type {
  Address,
  TermsAcceptance,
  UploadedFile,
  VerificationStatus,
} from "./ngo";
import type { PetAgeGroup, PetSize, PetSpecies } from "./pet";

/** Client-safe adopter profile model with personal information, housing, adoption preferences, and privacy consent, stored under StoredUser.adopter. */

// ---------------------------------------------------------------------------
// 1. Personal identification.
// ---------------------------------------------------------------------------

export type AdopterPersonal = {
  avatar: UploadedFile | null;
  fullName: string;
  /** Digits only. */
  personalTaxId: string;
  /** ISO date (YYYY-MM-DD). */
  birthDate: string;
  /** Digits only, including area code. */
  phone: string;
  /** ISO timestamp of code verification, or null. */
  phoneVerifiedAt: string | null;
  /** Personal biography visible to the NGO. */
  bio: string;
  occupation: string;
  instagram: string;
  idDocument: UploadedFile | null;
  addressProof: UploadedFile | null;
  address: Address;
};

// ---------------------------------------------------------------------------
// 2. Housing and daily routine.
// ---------------------------------------------------------------------------

export type HousingType = "house" | "apartment" | "farm";

export const HOUSING_TYPE_LABEL: Record<HousingType, string> = {
  house: "Casa",
  apartment: "Apartamento",
  farm: "Sítio ou chácara",
};

export type HousingOwnership = "owned" | "rented";

export const HOUSING_OWNERSHIP_LABEL: Record<HousingOwnership, string> = {
  owned: "Própria",
  rented: "Alugada",
};

export type AdopterHousing = {
  type: HousingType | "";
  ownership: HousingOwnership | "";
  /** Relevant only for rented housing. */
  landlordAllowsPets: boolean;
  hasYard: boolean;
  /** Window safety screens, particularly relevant for cats. */
  hasScreens: boolean;
  residentsCount: number | null;
  hasChildren: boolean;
  hasOtherPets: boolean;
  otherPetsDescription: string;
  hoursAloneOnWeekdays: number | null;
  hasPetExperience: boolean;
  acceptsHomeVisit: boolean;
};

// ---------------------------------------------------------------------------
// 3. Adoption preferences.
// ---------------------------------------------------------------------------

export type AdopterPreferences = {
  species: PetSpecies[];
  sizes: PetSize[];
  ageGroups: PetAgeGroup[];
  acceptsSpecialNeeds: boolean;
  /** Desired pet characteristics. */
  aboutIdealPet: string;
};

// ---------------------------------------------------------------------------
// 4. Verification.
// ---------------------------------------------------------------------------

export const ADOPTER_VERIFICATION_STATUS_LABEL: Record<
  VerificationStatus,
  string
> = {
  pending: "Perfil incompleto",
  under_review: "Em verificação",
  verified: "Adotante verificado",
  suspended: "Suspenso",
};

export type AdopterVerification = {
  status: VerificationStatus;
  /** ISO timestamp of the latest status change. */
  statusUpdatedAt: string;
  statusNote: string;
};

// ---------------------------------------------------------------------------
// 5. Legal and privacy consent.
// ---------------------------------------------------------------------------

export type AdopterLegalConsent = {
  /** Acceptance recorded during signup. Legacy accounts may have no record. */
  terms: TermsAcceptance | null;
};

// ---------------------------------------------------------------------------
// Complete profile.
// ---------------------------------------------------------------------------

export type AdopterProfile = {
  personal: AdopterPersonal;
  housing: AdopterHousing;
  preferences: AdopterPreferences;
  verification: AdopterVerification;
  legalConsent: AdopterLegalConsent;
};

export function createEmptyAdopterProfile(fullName: string): AdopterProfile {
  const now = new Date().toISOString();
  return {
    personal: {
      avatar: null,
      fullName,
      personalTaxId: "",
      birthDate: "",
      phone: "",
      phoneVerifiedAt: null,
      bio: "",
      occupation: "",
      instagram: "",
      idDocument: null,
      addressProof: null,
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
    housing: {
      type: "",
      ownership: "",
      landlordAllowsPets: false,
      hasYard: false,
      hasScreens: false,
      residentsCount: null,
      hasChildren: false,
      hasOtherPets: false,
      otherPetsDescription: "",
      hoursAloneOnWeekdays: null,
      hasPetExperience: false,
      acceptsHomeVisit: false,
    },
    preferences: {
      species: [],
      sizes: [],
      ageGroups: [],
      acceptsSpecialNeeds: false,
      aboutIdealPet: "",
    },
    verification: {
      status: "pending",
      statusUpdatedAt: now,
      statusNote: "",
    },
    legalConsent: {
      terms: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Profile-completion checklist.
// ---------------------------------------------------------------------------

export type AdopterProfileSection = "personal" | "housing" | "preferences";

export const ADOPTER_SECTION_LABEL: Record<AdopterProfileSection, string> = {
  personal: "Identificação",
  housing: "Moradia e rotina",
  preferences: "Preferências de adoção",
};

export const ADOPTER_SECTION_KEYS = Object.keys(
  ADOPTER_SECTION_LABEL,
) as AdopterProfileSection[];

export type AdopterChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  /** Profile section containing this checklist item. */
  section: AdopterProfileSection;
  /** Plain-language explanation of missing information; empty when complete. */
  missing: string;
};

export function getAdopterChecklist(
  profile: AdopterProfile,
): AdopterChecklistItem[] {
  const { personal, housing, preferences } = profile;
  const addressDone = Boolean(
    personal.address.postalCode &&
    personal.address.street &&
    personal.address.city &&
    personal.address.state,
  );

  const missingPersonal = [
    !personal.fullName && "nome completo",
    !personal.personalTaxId && "CPF",
    !personal.birthDate && "data de nascimento",
    !personal.phone && "telefone",
  ].filter(Boolean);
  const missingAddress = [
    !personal.address.postalCode && "CEP",
    !personal.address.street && "rua",
    !personal.address.city && "cidade",
    !personal.address.state && "estado",
  ].filter(Boolean);

  return [
    {
      id: "personal-info",
      label: "Nome completo, CPF, data de nascimento e telefone",
      done: Boolean(
        personal.fullName &&
        personal.personalTaxId &&
        personal.birthDate &&
        personal.phone,
      ),
      section: "personal",
      missing: missingPersonal.join(", "),
    },
    {
      id: "address",
      label: "Endereço (CEP, rua, cidade e estado)",
      done: addressDone,
      section: "personal",
      missing: missingAddress.join(", "),
    },
    {
      id: "id-document",
      label: "Documento com foto",
      done: personal.idDocument !== null,
      section: "personal",
      missing: "foto do documento",
    },
    {
      id: "housing",
      label: "Tipo de moradia e situação do imóvel",
      done: Boolean(housing.type && housing.ownership),
      section: "housing",
      missing: [
        !housing.type && "tipo de moradia",
        !housing.ownership && "situação do imóvel",
      ]
        .filter(Boolean)
        .join(", "),
    },
    {
      id: "preferences",
      label: "Espécies que você quer adotar",
      done: preferences.species.length > 0,
      section: "preferences",
      missing: "escolher ao menos uma espécie",
    },
  ];
}

/** Whether verification can be requested. */
export function isAdopterReadyForReview(profile: AdopterProfile): boolean {
  return getAdopterChecklist(profile).every((item) => item.done);
}
