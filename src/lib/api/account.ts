import {
  organizationResponseSchema,
  userResponseSchema,
  type OrganizationPrivateProfile,
  type OrganizationPublicProfile,
  type PersonalProfile,
} from "@/lib/backend/contracts";
import { mutationOptions } from "@tanstack/react-query";
import { ApiError, requestData, requestJson } from "./client";
import { queryKeys } from "./keys";
import { body } from "./mutations";
import { backendPath } from "./queries";

/** Organization kinds accepted by Go's public profile `type` enum. */
export const ORGANIZATION_TYPES = [
  "ngo",
  "shelter",
  "rescue_group",
  "independent",
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];
export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  ngo: "ONG",
  shelter: "Abrigo",
  rescue_group: "Grupo de resgate",
  independent: "Protetor independente",
};
const isOrganizationType = (value: string): value is OrganizationType =>
  ORGANIZATION_TYPES.some((type) => type === value);

/** Limits mirrored from Go's profile contracts (profile_contracts.go). */
export const PROFILE_LIMITS = {
  occupation: 120,
  biography: 3000,
  socialLinks: 10,
  housing: 2000,
  preferences: 30,
  personalDocuments: 20,
  postalCode: 20,
  street: 200,
  number: 20,
  complement: 100,
  neighborhood: 100,
  gallery: 30,
  capacity: 100000,
  serviceAreas: 100,
  adoptionPolicy: 10000,
  representativeName: 120,
  representativePhone: 30,
  organizationDocuments: 30,
  slug: 120,
} as const;

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** Brazilian CPF checksum, identical to Go's validCPF. */
export function isValidCpf(value: string): boolean {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  for (let length = 9; length < 11; length++) {
    let sum = 0;
    for (let index = 0; index < length; index++)
      sum += Number(value[index]) * (length + 1 - index);
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== Number(value[length])) return false;
  }
  return true;
}

export const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") && !!url.host
    );
  } catch {
    return false;
  }
};

/** Split a multi-line text field into trimmed, non-empty entries. */
export const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export type PersonalProfileInput = {
  cpf: string;
  birthDate: string;
  occupation: string;
  biography: string;
  socialLinks: string[];
  address: {
    postalCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
  };
  housing: string;
  preferences: string[];
  documents: string[];
  avatarUrl: string;
  allowOrganizationContact: boolean;
};

/** Go replaces the whole stored profile, so every save sends every field. */
export function toPersonalProfileInput(
  profile: PersonalProfile,
): PersonalProfileInput {
  return {
    cpf: profile.cpf ?? "",
    birthDate: profile.birthDate ?? "",
    occupation: profile.occupation ?? "",
    biography: profile.biography ?? "",
    socialLinks: profile.socialLinks ?? [],
    address: {
      postalCode: profile.address?.postalCode ?? "",
      street: profile.address?.street ?? "",
      number: profile.address?.number ?? "",
      complement: profile.address?.complement ?? "",
      neighborhood: profile.address?.neighborhood ?? "",
    },
    housing: profile.housing ?? "",
    preferences: profile.preferences ?? [],
    documents: profile.documents ?? [],
    avatarUrl: profile.avatarUrl ?? "",
    allowOrganizationContact: profile.allowOrganizationContact ?? false,
  };
}

/** Trim text, normalize CPF digits, and drop empty list entries. */
export function normalizePersonalProfile(
  input: PersonalProfileInput,
): PersonalProfileInput {
  const trim = (value: string) => value.trim();
  return {
    cpf: onlyDigits(input.cpf),
    birthDate: input.birthDate.trim(),
    occupation: trim(input.occupation),
    biography: trim(input.biography),
    socialLinks: input.socialLinks.map(trim).filter(Boolean),
    address: {
      postalCode: trim(input.address.postalCode),
      street: trim(input.address.street),
      number: trim(input.address.number),
      complement: trim(input.address.complement),
      neighborhood: trim(input.address.neighborhood),
    },
    housing: trim(input.housing),
    preferences: input.preferences.map(trim).filter(Boolean),
    documents: input.documents.filter(Boolean),
    avatarUrl: input.avatarUrl.trim(),
    allowOrganizationContact: input.allowOrganizationContact,
  };
}

/** Portuguese validation error for a personal profile, or null. */
export function validatePersonalProfile(
  input: PersonalProfileInput,
  today = new Date(),
): string | null {
  if (input.cpf && !isValidCpf(input.cpf))
    return "Informe um CPF válido, com 11 dígitos.";
  if (input.birthDate) {
    const date = new Date(`${input.birthDate}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.getTime() > today.getTime())
      return "Informe uma data de nascimento válida, que não esteja no futuro.";
  }
  if (input.socialLinks.length > PROFILE_LIMITS.socialLinks)
    return `Informe no máximo ${PROFILE_LIMITS.socialLinks} redes sociais.`;
  if (input.socialLinks.some((link) => !isHttpUrl(link)))
    return "Cada rede social deve ser um endereço completo, começando com https://.";
  if (input.preferences.length > PROFILE_LIMITS.preferences)
    return `Informe no máximo ${PROFILE_LIMITS.preferences} preferências.`;
  if (input.documents.length > PROFILE_LIMITS.personalDocuments)
    return `Envie no máximo ${PROFILE_LIMITS.personalDocuments} documentos.`;
  return null;
}

/**
 * Drop empty strings, false, empty lists and empty objects. Go validates the
 * raw JSON against its schema, where "" fails CPF/date/e-mail/enum formats.
 */
export function compactProfile(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value
      .map((item: unknown) => compactProfile(item))
      .filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]: [string, unknown]) => [key, compactProfile(item)])
      .filter(([, item]) => item !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  if (value === "" || value === false || value === null) return undefined;
  return value;
}

export const isSameValue = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right);

export type OrganizationPublicProfileInput = {
  type?: OrganizationType;
  logoUrl: string;
  gallery: string[];
  capacity?: number;
  serviceAreas: string[];
  adoptionPolicy: string;
};

export function toOrganizationPublicProfileInput(
  profile: OrganizationPublicProfile,
): OrganizationPublicProfileInput {
  return {
    type:
      profile.type && isOrganizationType(profile.type)
        ? profile.type
        : undefined,
    logoUrl: profile.logoUrl ?? "",
    gallery: profile.gallery ?? [],
    capacity: profile.capacity,
    serviceAreas: profile.serviceAreas ?? [],
    adoptionPolicy: profile.adoptionPolicy ?? "",
  };
}

export function validateOrganizationPublicProfile(
  input: OrganizationPublicProfileInput,
): string | null {
  if (
    input.capacity !== undefined &&
    (!Number.isInteger(input.capacity) ||
      input.capacity < 0 ||
      input.capacity > PROFILE_LIMITS.capacity)
  )
    return `A capacidade deve ser um número inteiro entre 0 e ${PROFILE_LIMITS.capacity.toLocaleString("pt-BR")}.`;
  if (input.gallery.length > PROFILE_LIMITS.gallery)
    return `Envie no máximo ${PROFILE_LIMITS.gallery} fotos na galeria.`;
  if (input.serviceAreas.length > PROFILE_LIMITS.serviceAreas)
    return `Informe no máximo ${PROFILE_LIMITS.serviceAreas} áreas de atuação.`;
  return null;
}

export type OrganizationPrivateProfileInput = {
  representativeName: string;
  representativeCpf: string;
  representativeEmail: string;
  representativePhone: string;
  documents: string[];
  consentPublicContact: boolean;
  consentDocumentReview: boolean;
};

export function toOrganizationPrivateProfileInput(
  profile: OrganizationPrivateProfile | undefined,
): OrganizationPrivateProfileInput {
  return {
    representativeName: profile?.representativeName ?? "",
    representativeCpf: profile?.representativeCpf ?? "",
    representativeEmail: profile?.representativeEmail ?? "",
    representativePhone: profile?.representativePhone ?? "",
    documents: profile?.documents ?? [],
    consentPublicContact: profile?.consentPublicContact ?? false,
    consentDocumentReview: profile?.consentDocumentReview ?? false,
  };
}

export function normalizeOrganizationPrivateProfile(
  input: OrganizationPrivateProfileInput,
): OrganizationPrivateProfileInput {
  return {
    representativeName: input.representativeName.trim(),
    representativeCpf: onlyDigits(input.representativeCpf),
    representativeEmail: input.representativeEmail.trim(),
    representativePhone: input.representativePhone.trim(),
    documents: input.documents.filter(Boolean),
    consentPublicContact: input.consentPublicContact,
    consentDocumentReview: input.consentDocumentReview,
  };
}

export function validateOrganizationPrivateProfile(
  input: OrganizationPrivateProfileInput,
): string | null {
  if (input.representativeCpf && !isValidCpf(input.representativeCpf))
    return "Informe um CPF válido para o representante, com 11 dígitos.";
  if (
    input.representativeEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.representativeEmail)
  )
    return "Informe um e-mail válido para o representante.";
  if (input.documents.length > PROFILE_LIMITS.organizationDocuments)
    return `Envie no máximo ${PROFILE_LIMITS.organizationDocuments} documentos.`;
  return null;
}

/** Portuguese message for account and profile failures, keyed by HTTP status. */
export function accountErrorMessage(
  error: unknown,
  action: "delete" | "profile" | "organization",
): string {
  if (error instanceof ApiError) {
    if (action === "delete" && error.status === 403)
      return "Senha incorreta. Confira a senha e tente novamente.";
    if (action === "delete" && error.status === 409)
      return "Você é a única pessoa que administra uma ONG. Transfira a gestão para outro membro (com permissão de gerenciar membros) antes de excluir sua conta.";
    if (action === "organization" && error.status === 409)
      return "Esse endereço da ONG já está em uso. Escolha outro.";
    if (error.status === 422 || error.status === 400)
      return action === "profile"
        ? "Revise os dados do perfil: CPF, data de nascimento e links devem ser válidos."
        : "Revise os campos informados: CPF, e-mail, endereço e links devem ser válidos.";
  }
  if (error instanceof Error) return error.message;
  return "Não foi possível concluir a solicitação.";
}

export const accountMutations = {
  /** Deactivates the account in Go and revokes every session. */
  deleteAccount: () =>
    mutationOptions({
      mutationKey: ["account", "delete"],
      meta: { resetsSession: true },
      mutationFn: async (input: { password: string }) => {
        await requestJson(backendPath("/v1/me"), body(input, "DELETE"));
      },
    }),
  /** Replaces the full personal profile; Go resets personal verification. */
  updatePersonalProfile: () =>
    mutationOptions({
      mutationKey: ["profile", "personal"],
      meta: { invalidates: [queryKeys.session, queryKeys.profile] },
      mutationFn: (input: { profile: PersonalProfileInput }) =>
        requestData(
          backendPath("/v1/me"),
          userResponseSchema,
          body({ profile: compactProfile(input.profile) ?? {} }, "PATCH"),
        ),
    }),
  /**
   * Updates the slug, public profile and/or private profile. Sending
   * `privateProfile` returns a non-suspended organization to review.
   */
  updateOrganizationProfile: () =>
    mutationOptions({
      mutationKey: ["organizations", "profile"],
      meta: { invalidates: [queryKeys.organizations, queryKeys.session] },
      mutationFn: (input: {
        id: string;
        changes: {
          slug?: string;
          profile?: OrganizationPublicProfileInput;
          privateProfile?: OrganizationPrivateProfileInput;
        };
      }) =>
        requestData(
          backendPath(`/v1/organizations/${encodeURIComponent(input.id)}`),
          organizationResponseSchema,
          body(
            {
              slug: input.changes.slug,
              profile: input.changes.profile
                ? (compactProfile(input.changes.profile) ?? {})
                : undefined,
              privateProfile: input.changes.privateProfile
                ? (compactProfile(input.changes.privateProfile) ?? {})
                : undefined,
            },
            "PATCH",
          ),
        ),
    }),
};
