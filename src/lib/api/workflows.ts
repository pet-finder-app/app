import {
  adoptionApplicationSchema,
  agreementResponseSchema,
  agreementTemplateSchema,
  collectionResponseAnimalSchema,
  collectionResponseSurrenderResponseSchema,
  followupListSchema,
  followupResponseSchema,
  surrenderResponseSchema,
  templateListSchema,
} from "@/lib/backend/contracts";
import {
  infiniteQueryOptions,
  mutationOptions,
  queryOptions,
} from "@tanstack/react-query";
import { ApiError, requestData, requestJson } from "./client";
import { queryKeys } from "./keys";
import type { ApiMutationMeta } from "./meta";
import { body } from "./mutations";
import { nextPageParam } from "./pagination";
import { backendPath } from "./queries";

/**
 * Adoption agreements, post-adoption follow-ups and surrender/return cases.
 * Agreement and follow-up keys nest under an application so invalidating
 * `queryKeys.applications` also refreshes them.
 */
export const workflowKeys = {
  agreementTemplates: (organizationId: string) =>
    ["organizations", organizationId, "agreement-templates"] as const,
  agreements: ["agreements"] as const,
  agreement: (id: string) => ["agreements", id] as const,
  agreementDigest: (id: string, sha256: string) =>
    ["agreements", id, "digest", sha256] as const,
  applicationAgreement: (applicationId: string) =>
    [...queryKeys.application(applicationId), "agreement"] as const,
  followups: ["follow-ups"] as const,
  applicationFollowups: (applicationId: string) =>
    [...queryKeys.application(applicationId), "follow-ups"] as const,
  followup: (id: string) => ["follow-ups", id] as const,
  surrenders: ["surrenders"] as const,
  surrenderList: (organizationId: string | undefined) =>
    ["surrenders", "list", organizationId ?? "me"] as const,
  /** Under the inventory prefix so animal mutations refresh the selector. */
  ownAnimals: [...queryKeys.inventory(), "surrender-pages"] as const,
  surrender: (id: string) => ["surrenders", "detail", id] as const,
  surrenderAgreement: (id: string) =>
    ["surrenders", "detail", id, "agreement"] as const,
} as const;

export const AGREEMENT_PLACEHOLDERS = [
  "user_name",
  "organization_name",
  "animal_name",
  "representative_name",
  "date",
] as const;
export type AgreementKind = "adoption" | "surrender";
export type WelfareStatus = "good" | "needs_attention" | "urgent";
export type FollowupDecision = "closed" | "changes_requested";
export type SurrenderDecisionValue =
  "accepted" | "rejected" | "needs_information";
export type SurrenderAnimalInput = {
  name: string;
  species:
    "dog" | "cat" | "bird" | "rabbit" | "reptile" | "small_mammal" | "other";
  sex: "female" | "male" | "unknown";
  size: "small" | "medium" | "large" | "extra_large";
  description: string;
  breed?: string;
  approximateBirthDate?: string;
  healthNotes?: string;
  behaviorNotes?: string;
  /** Kept from an earlier snapshot so resubmission does not drop details. */
  attributes?: Record<string, unknown>;
  location: { city: string; state: string; countryCode: string };
};
export type SurrenderInput = {
  organizationId: string;
  kind: "intake" | "return";
  animalId?: string;
  applicationId?: string;
  animal?: SurrenderAnimalInput;
  reason: string;
  documents: string[];
};

/** Report every unknown or misspelled placeholder before Go rejects it. */
export function invalidPlaceholders(text: string): string[] {
  const allowed = new Set<string>(AGREEMENT_PLACEHOLDERS);
  const found = new Set<string>();
  for (const match of text.matchAll(/\{\{([^{}]*)\}\}/g))
    if (!allowed.has(match[1])) found.add(match[0]);
  const stray = text.replace(/\{\{[^{}]*\}\}/g, "");
  if (stray.includes("{{") || stray.includes("}}")) found.add("{{ }}");
  return [...found];
}

type StatusMessages = Partial<Record<number, string>>;
/** Go problems are English; replace them with workflow-specific Portuguese. */
async function withMessages<T>(
  request: Promise<T>,
  messages: StatusMessages,
): Promise<T> {
  try {
    return await request;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      const message = messages[error.status];
      if (message)
        throw new ApiError(
          error.status,
          message,
          error.field,
          error.isInternal,
          error.isAuthenticationFailure,
        );
    }
    throw error;
  }
}
/** Go answers e-mail delivery with an empty 202 body. */
async function requestAccepted(path: string): Promise<void> {
  try {
    await requestJson(path, { method: "POST" });
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 202) return;
    throw error;
  }
}
/** Read a resource that does not exist until a later workflow step. */
async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
const id = (value: string) => encodeURIComponent(value);

const EMAIL_UNAVAILABLE =
  "O envio de e-mails não está configurado no servidor, por isso o código não pode ser enviado agora. Avise a equipe Petfinder e tente mais tarde.";
const RESEND_LIMIT =
  "Um código foi enviado há menos de um minuto. Aguarde antes de pedir outro.";

export function agreementTemplatesOptions(organizationId: string) {
  return queryOptions({
    queryKey: workflowKeys.agreementTemplates(organizationId),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(
          `/v1/organizations/${id(organizationId)}/agreement-templates`,
        ),
        templateListSchema,
        { signal },
      ),
  });
}
export function agreementOptions(agreementId: string) {
  return queryOptions({
    queryKey: workflowKeys.agreement(agreementId),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/agreements/${id(agreementId)}`),
        agreementResponseSchema,
        { signal },
      ),
  });
}
/** The application's agreement, or null before the organization creates it. */
export function applicationAgreementOptions(applicationId: string) {
  return queryOptions({
    queryKey: workflowKeys.applicationAgreement(applicationId),
    queryFn: ({ signal }) =>
      orNull(
        requestData(
          backendPath(`/v1/applications/${id(applicationId)}/agreement`),
          agreementResponseSchema,
          { signal },
        ),
      ),
  });
}
export function surrenderAgreementOptions(surrenderId: string) {
  return queryOptions({
    queryKey: workflowKeys.surrenderAgreement(surrenderId),
    queryFn: ({ signal }) =>
      orNull(
        requestData(
          backendPath(`/v1/surrenders/${id(surrenderId)}/agreement`),
          agreementResponseSchema,
          { signal },
        ),
      ),
  });
}
export function applicationFollowupsOptions(applicationId: string) {
  return queryOptions({
    queryKey: workflowKeys.applicationFollowups(applicationId),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/applications/${id(applicationId)}/follow-ups`),
        followupListSchema,
        { signal },
      ),
  });
}
export function followupOptions(followupId: string) {
  return queryOptions({
    queryKey: workflowKeys.followup(followupId),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/follow-ups/${id(followupId)}`),
        followupResponseSchema,
        { signal },
      ),
  });
}
export const SURRENDER_PAGE_SIZE = 20;
/** The requester's own cases, or an organization's cases with its id. */
export function surrendersOptions(organizationId?: string) {
  return infiniteQueryOptions({
    queryKey: workflowKeys.surrenderList(organizationId),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        page_size: String(SURRENDER_PAGE_SIZE),
      });
      if (organizationId) params.set("organization_id", organizationId);
      return requestData(
        backendPath(`/v1/surrenders?${params}`),
        collectionResponseSurrenderResponseSchema,
        { signal },
      );
    },
    getNextPageParam: nextPageParam,
  });
}
/** Every animal the caller registered, page by page, for the intake form. */
export function ownAnimalsOptions() {
  return infiniteQueryOptions({
    queryKey: workflowKeys.ownAnimals,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      requestData(
        backendPath(`/v1/me/animals?page=${pageParam}&page_size=50`),
        collectionResponseAnimalSchema,
        { signal },
      ),
    getNextPageParam: nextPageParam,
  });
}
export function surrenderOptions(surrenderId: string) {
  return queryOptions({
    queryKey: workflowKeys.surrender(surrenderId),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/surrenders/${id(surrenderId)}`),
        surrenderResponseSchema,
        { signal },
      ),
  });
}

const applicationMeta: ApiMutationMeta = {
  invalidates: [
    queryKeys.applications,
    queryKeys.conversations,
    queryKeys.animals,
    queryKeys.appointments,
  ],
};
const agreementMeta: ApiMutationMeta = {
  invalidates: [
    workflowKeys.agreements,
    queryKeys.applications,
    workflowKeys.surrenders,
  ],
};
const followupMeta: ApiMutationMeta = {
  invalidates: [workflowKeys.followups, queryKeys.applications],
};
const surrenderMeta: ApiMutationMeta = {
  invalidates: [workflowKeys.surrenders, workflowKeys.agreements],
};
const handoverMeta: ApiMutationMeta = {
  invalidates: [
    workflowKeys.surrenders,
    queryKeys.animals,
    queryKeys.applications,
  ],
};

export const workflowMutations = {
  /** Organization managers or administrators end an active application. */
  cancelApplication: () =>
    mutationOptions({
      mutationKey: ["applications", "cancel"],
      meta: applicationMeta,
      mutationFn: (input: { id: string; reason: string }) =>
        withMessages(
          requestData(
            backendPath(`/v1/applications/${id(input.id)}/cancellation`),
            adoptionApplicationSchema,
            body({ reason: input.reason }),
          ),
          {
            403: "Somente quem gerencia pedidos desta ONG pode cancelar o pedido.",
            409: "Este pedido não pode mais ser cancelado. Atualize a página para ver a situação atual.",
          },
        ),
    }),
  createTemplate: (organizationId: string) =>
    mutationOptions({
      mutationKey: ["agreements", "template"],
      meta: { invalidates: [workflowKeys.agreementTemplates(organizationId)] },
      mutationFn: (input: { kind: AgreementKind; body: string }) =>
        withMessages(
          requestData(
            backendPath(
              `/v1/organizations/${id(organizationId)}/agreement-templates`,
            ),
            agreementTemplateSchema,
            body(input),
          ),
          {
            403: "Somente quem gerencia pedidos desta ONG pode publicar modelos de termo.",
            422: "Revise o texto: ele precisa ter pelo menos 20 caracteres e usar apenas os campos automáticos listados.",
          },
        ),
    }),
  createAgreement: () =>
    mutationOptions({
      mutationKey: ["agreements", "create"],
      meta: agreementMeta,
      mutationFn: (input: {
        subject: "application" | "surrender";
        id: string;
        templateId: string;
        representativeId: string;
      }) =>
        withMessages(
          requestData(
            backendPath(
              `/v1/${input.subject === "application" ? "applications" : "surrenders"}/${id(input.id)}/agreement`,
            ),
            agreementResponseSchema,
            body({
              templateId: input.templateId,
              representativeId: input.representativeId,
            }),
          ),
          {
            403: "Somente quem gerencia pedidos desta ONG pode preparar o termo.",
            404: "O modelo escolhido não foi encontrado para este tipo de termo.",
            409: "O termo não pode ser criado agora: ele já existe ou o processo não está aprovado nem concluído.",
            422: "O representante precisa ser um membro ativo que gerencia pedidos e não pode ser a própria pessoa que assina pelo outro lado.",
          },
        ),
    }),
  sendSigningCode: () =>
    mutationOptions({
      mutationKey: ["agreements", "signing-code"],
      mutationFn: (agreementId: string) =>
        withMessages(
          requestAccepted(
            backendPath(`/v1/agreements/${id(agreementId)}/signing-code`),
          ),
          {
            403: "Somente as pessoas indicadas no termo podem assiná-lo.",
            409: "Este termo não pode ser assinado agora: você já assinou ou o processo não está mais aprovado.",
            429: RESEND_LIMIT,
            503: EMAIL_UNAVAILABLE,
          },
        ),
    }),
  signAgreement: () =>
    mutationOptions({
      mutationKey: ["agreements", "sign"],
      meta: agreementMeta,
      mutationFn: (input: { id: string; code: string; sha256: string }) =>
        withMessages(
          requestData(
            backendPath(`/v1/agreements/${id(input.id)}/signatures`),
            agreementResponseSchema,
            body({ code: input.code, sha256: input.sha256, accept: true }),
          ),
          {
            403: "Somente as pessoas indicadas no termo podem assiná-lo.",
            409: "Não foi possível assinar: o código expirou, já foi usado ou foi bloqueado após 5 tentativas. Peça um novo código.",
            422: "Código incorreto ou não solicitado. Confira o e-mail e tente novamente.",
          },
        ),
    }),
  scheduleFollowup: () =>
    mutationOptions({
      mutationKey: ["follow-ups", "schedule"],
      meta: followupMeta,
      mutationFn: (input: {
        applicationId: string;
        dueAt: string;
        instructions: string;
      }) =>
        withMessages(
          requestData(
            backendPath(
              `/v1/applications/${id(input.applicationId)}/follow-ups`,
            ),
            followupResponseSchema,
            body({ dueAt: input.dueAt, instructions: input.instructions }),
          ),
          {
            409: "Acompanhamentos só podem ser agendados depois que a adoção é concluída.",
            422: "Escolha uma data futura e descreva o que o adotante deve informar.",
          },
        ),
    }),
  /** Reschedule or reword a follow-up still waiting for the adopter. */
  updateFollowup: () =>
    mutationOptions({
      mutationKey: ["follow-ups", "update"],
      meta: followupMeta,
      mutationFn: (input: {
        id: string;
        dueAt?: string;
        instructions?: string;
      }) =>
        withMessages(
          requestData(
            backendPath(`/v1/follow-ups/${id(input.id)}`),
            followupResponseSchema,
            body(
              { dueAt: input.dueAt, instructions: input.instructions },
              "PATCH",
            ),
          ),
          {
            403: "Somente quem gerencia pedidos desta ONG pode alterar o acompanhamento.",
            409: "Este acompanhamento não pode mais ser alterado: o relato já foi enviado ou ele foi encerrado.",
            422: "Escolha uma data futura e descreva o que o adotante deve informar.",
          },
        ),
    }),
  cancelFollowup: () =>
    mutationOptions({
      mutationKey: ["follow-ups", "cancel"],
      meta: followupMeta,
      mutationFn: (input: { id: string; reason: string }) =>
        withMessages(
          requestData(
            backendPath(`/v1/follow-ups/${id(input.id)}/cancellation`),
            followupResponseSchema,
            body({ reason: input.reason }),
          ),
          {
            403: "Somente quem gerencia pedidos desta ONG pode cancelar o acompanhamento.",
            409: "Este acompanhamento já foi encerrado ou cancelado.",
            422: "Explique o motivo do cancelamento em 5 a 2000 caracteres.",
          },
        ),
    }),
  submitFollowupReport: () =>
    mutationOptions({
      mutationKey: ["follow-ups", "report"],
      meta: followupMeta,
      mutationFn: (input: {
        id: string;
        notes: string;
        welfareStatus: WelfareStatus;
        mediaIds: string[];
      }) =>
        withMessages(
          requestData(
            backendPath(`/v1/follow-ups/${id(input.id)}/reports`),
            followupResponseSchema,
            body({
              notes: input.notes,
              welfareStatus: input.welfareStatus,
              mediaIds: input.mediaIds,
            }),
          ),
          {
            403: "Somente o adotante pode enviar o relato de acompanhamento.",
            409: "Este acompanhamento não está aguardando um relato.",
          },
        ),
    }),
  reviewFollowup: () =>
    mutationOptions({
      mutationKey: ["follow-ups", "review"],
      meta: followupMeta,
      mutationFn: (input: {
        id: string;
        decision: FollowupDecision;
        reason: string;
      }) =>
        withMessages(
          requestData(
            backendPath(`/v1/follow-ups/${id(input.id)}/review`),
            followupResponseSchema,
            body({ decision: input.decision, reason: input.reason }),
          ),
          {
            403: "Somente quem gerencia pedidos desta ONG pode analisar relatos.",
            409: "Este acompanhamento não tem um relato aguardando análise.",
          },
        ),
    }),
  createSurrender: () =>
    mutationOptions({
      mutationKey: ["surrenders", "create"],
      meta: surrenderMeta,
      mutationFn: (input: SurrenderInput) =>
        withMessages(
          requestData(
            backendPath("/v1/surrenders"),
            surrenderResponseSchema,
            body(input),
          ),
          {
            403: "Você não pode solicitar a entrega deste animal para esta ONG.",
            409: "A solicitação não pode ser aberta: a ONG precisa estar verificada e o animal não pode ter outro processo ou pedido de adoção em andamento.",
          },
        ),
    }),
  resubmitSurrender: () =>
    mutationOptions({
      mutationKey: ["surrenders", "resubmit"],
      meta: surrenderMeta,
      mutationFn: (input: {
        id: string;
        animal?: SurrenderAnimalInput;
        reason: string;
        documents: string[];
      }) =>
        withMessages(
          requestData(
            backendPath(`/v1/surrenders/${id(input.id)}`),
            surrenderResponseSchema,
            body(
              {
                animal: input.animal,
                reason: input.reason,
                documents: input.documents,
              },
              "PUT",
            ),
          ),
          {
            403: "Somente quem abriu a solicitação pode reenviá-la.",
            409: "A ONG não está aguardando novas informações nesta solicitação.",
          },
        ),
    }),
  decideSurrender: () =>
    mutationOptions({
      mutationKey: ["surrenders", "decision"],
      meta: surrenderMeta,
      mutationFn: (input: {
        id: string;
        decision: SurrenderDecisionValue;
        reason: string;
      }) =>
        withMessages(
          requestData(
            backendPath(`/v1/surrenders/${id(input.id)}/decision`),
            surrenderResponseSchema,
            body({ decision: input.decision, reason: input.reason }),
          ),
          {
            403: "Somente quem gerencia pedidos desta ONG pode analisar a solicitação.",
            409: "Esta solicitação não está mais aguardando análise.",
          },
        ),
    }),
  cancelSurrender: () =>
    mutationOptions({
      mutationKey: ["surrenders", "cancel"],
      meta: surrenderMeta,
      mutationFn: (input: { id: string; reason: string }) =>
        withMessages(
          requestData(
            backendPath(`/v1/surrenders/${id(input.id)}/cancellation`),
            surrenderResponseSchema,
            body({ reason: input.reason }),
          ),
          {
            409: "A solicitação não pode mais ser cancelada, porque a entrega já começou ou o processo foi encerrado.",
          },
        ),
    }),
  sendHandoverCode: () =>
    mutationOptions({
      mutationKey: ["surrenders", "handover-code"],
      mutationFn: (surrenderId: string) =>
        withMessages(
          requestAccepted(
            backendPath(`/v1/surrenders/${id(surrenderId)}/handover-code`),
          ),
          {
            403: "Somente quem abriu a solicitação recebe o código de entrega.",
            409: "O código só pode ser enviado depois que as duas partes assinarem o termo e antes do recebimento pela ONG.",
            429: RESEND_LIMIT,
            503: EMAIL_UNAVAILABLE,
          },
        ),
    }),
  confirmHandover: () =>
    mutationOptions({
      mutationKey: ["surrenders", "handover"],
      meta: handoverMeta,
      mutationFn: (input: {
        id: string;
        type: "delivery" | "receipt";
        code?: string;
      }) =>
        withMessages(
          requestData(
            backendPath(`/v1/surrenders/${id(input.id)}/handover`),
            surrenderResponseSchema,
            body({ type: input.type, code: input.code }),
          ),
          {
            403:
              input.type === "delivery"
                ? "Somente quem abriu a solicitação confirma a entrega."
                : "Somente quem gerencia pedidos desta ONG confirma o recebimento.",
            409: "A confirmação não é possível agora: o termo precisa estar assinado pelas duas partes e esta etapa não pode ter sido confirmada antes.",
            422: "Código de entrega incorreto, expirado ou bloqueado após 5 tentativas. Peça ao solicitante um novo código.",
          },
        ),
    }),
};
