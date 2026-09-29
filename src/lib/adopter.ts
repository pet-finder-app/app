import type {
  Address,
  TermsAcceptance,
  UploadedFile,
  VerificationStatus,
} from "./ong";
import type { PetAgeGroup, PetSize, PetSpecies } from "./pet";

/**
 * Modelo de dados do adotante, espelhando `lib/ong.ts` mas focado em quem
 * quer adotar: identificação pessoal, moradia/rotina (o que uma ONG avalia
 * antes de entregar um pet), preferências de adoção e LGPD. Tudo fica dentro
 * de `StoredUser.adopter` no users.json.
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

// ---------------------------------------------------------------------------
// 1. Identificação pessoal
// ---------------------------------------------------------------------------

export type AdopterPersonal = {
  avatar: UploadedFile | null;
  fullName: string;
  /** Só dígitos. */
  cpf: string;
  /** ISO date (YYYY-MM-DD). */
  birthDate: string;
  /** Só dígitos, com DDD. */
  phone: string;
  /** ISO datetime da confirmação por código, ou null. */
  phoneVerifiedAt: string | null;
  /** Fala sobre você para a ONG conhecer. */
  bio: string;
  occupation: string;
  instagram: string;
  idDocument: UploadedFile | null;
  addressProof: UploadedFile | null;
  address: Address;
};

// ---------------------------------------------------------------------------
// 2. Moradia e rotina
// ---------------------------------------------------------------------------

export type HousingType = "casa" | "apartamento" | "sitio_chacara";

export const HOUSING_TYPE_LABEL: Record<HousingType, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  sitio_chacara: "Sítio ou chácara",
};

export type HousingOwnership = "propria" | "alugada";

export const HOUSING_OWNERSHIP_LABEL: Record<HousingOwnership, string> = {
  propria: "Própria",
  alugada: "Alugada",
};

export type AdopterHousing = {
  type: HousingType | "";
  ownership: HousingOwnership | "";
  /** Só relevante quando `ownership === "alugada"`. */
  landlordAllowsPets: boolean;
  hasYard: boolean;
  /** Telas de proteção nas janelas — importante para gatos. */
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
// 3. Preferências de adoção
// ---------------------------------------------------------------------------

export type AdopterPreferences = {
  species: PetSpecies[];
  sizes: PetSize[];
  ageGroups: PetAgeGroup[];
  acceptsSpecialNeeds: boolean;
  /** O que você procura num pet. */
  aboutIdealPet: string;
};

// ---------------------------------------------------------------------------
// 4. Verificação
// ---------------------------------------------------------------------------

export const ADOPTER_VERIFICATION_STATUS_LABEL: Record<
  VerificationStatus,
  string
> = {
  pendente: "Perfil incompleto",
  em_analise: "Em verificação",
  verificada: "Adotante verificado",
  suspensa: "Suspenso",
};

export type AdopterVerification = {
  status: VerificationStatus;
  /** ISO datetime da última mudança de status. */
  statusUpdatedAt: string;
  statusNote: string;
};

// ---------------------------------------------------------------------------
// 5. Jurídico e LGPD
// ---------------------------------------------------------------------------

export type AdopterLegalConsent = {
  /** Null até o adotante aceitar em /adotante/perfil — o cadastro não pede
   *  isso na hora da conta (ver `register-form.tsx`). */
  terms: TermsAcceptance | null;
};

// ---------------------------------------------------------------------------
// Perfil completo
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
      cpf: "",
      birthDate: "",
      phone: "",
      phoneVerifiedAt: null,
      bio: "",
      occupation: "",
      instagram: "",
      idDocument: null,
      addressProof: null,
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
      status: "pendente",
      statusUpdatedAt: now,
      statusNote: "",
    },
    legalConsent: {
      terms: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Checklist: o que falta para o perfil ficar completo
// ---------------------------------------------------------------------------

export type AdopterProfileSection =
  "personal" | "housing" | "preferences" | "legalConsent";

export const ADOPTER_SECTION_LABEL: Record<AdopterProfileSection, string> = {
  personal: "Identificação",
  housing: "Moradia e rotina",
  preferences: "Preferências de adoção",
  legalConsent: "Termos e LGPD",
};

export const ADOPTER_SECTION_KEYS = Object.keys(
  ADOPTER_SECTION_LABEL,
) as AdopterProfileSection[];

export type AdopterChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  /** Seção de /adotante/perfil onde o item é preenchido. */
  section: AdopterProfileSection;
};

export function getAdopterChecklist(
  profile: AdopterProfile,
): AdopterChecklistItem[] {
  const { personal, housing, preferences, legalConsent } = profile;
  const addressDone = Boolean(
    personal.address.cep &&
    personal.address.street &&
    personal.address.city &&
    personal.address.state,
  );

  return [
    {
      id: "personal-info",
      label: "Nome completo, CPF, data de nascimento e telefone",
      done: Boolean(
        personal.fullName &&
        personal.cpf &&
        personal.birthDate &&
        personal.phone,
      ),
      section: "personal",
    },
    {
      id: "address",
      label: "Endereço completo com CEP",
      done: addressDone,
      section: "personal",
    },
    {
      id: "id-document",
      label: "Documento com foto",
      done: personal.idDocument !== null,
      section: "personal",
    },
    {
      id: "housing",
      label: "Tipo de moradia e situação do imóvel",
      done: Boolean(housing.type && housing.ownership),
      section: "housing",
    },
    {
      id: "preferences",
      label: "Espécies que você quer adotar",
      done: preferences.species.length > 0,
      section: "preferences",
    },
    {
      id: "consent",
      label: "Aceite dos termos de uso e da LGPD",
      done: legalConsent.terms !== null,
      section: "legalConsent",
    },
  ];
}

/** Pode pedir verificação? */
export function isAdopterReadyForReview(profile: AdopterProfile): boolean {
  return getAdopterChecklist(profile).every((item) => item.done);
}
