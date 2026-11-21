import {
  animalAttributesSchema,
  animalHistoryResponseSchema,
  animalImageResponseSchema,
  animalSchema,
  collectionResponseAnimalSchema,
  collectionResponseListAvailableAnimalsRowSchema,
  conversationSchema,
  interestResponseSchema,
  organizationAnalyticsSchema,
  type AnimalAttributes,
} from "@/lib/backend/contracts";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { ApiError, requestData } from "./client";
import { mutationKeys, queryKeys } from "./keys";
import type { ApiMutationMeta } from "./meta";
import { body, uploadMedia, type LocationInput } from "./mutations";
import { backendPath } from "./queries";

export const ANIMAL_SPECIES = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "reptile",
  "small_mammal",
  "other",
] as const;
export const animalSpeciesSchema = z.enum(ANIMAL_SPECIES);
export type AnimalSpecies = z.output<typeof animalSpeciesSchema>;
export const energyLevelSchema = z.enum(["low", "medium", "high"]);
export type EnergyLevel = z.output<typeof energyLevelSchema>;

export const INVENTORY_STATUSES = [
  "pending_organization",
  "available",
  "adoption_in_progress",
  "adopted",
  "unavailable",
  "under_review",
  "archived",
] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

/** Structured attributes accepted by Go (`animalAttributes` in contracts.go). */
export type AnimalAttributesInput = {
  heightCm?: number;
  weightKg?: number;
  temperament?: string[];
  vaccinated?: boolean;
  neutered?: boolean;
  specialNeeds?: boolean;
  medicalConditions?: string[];
  energyLevel?: EnergyLevel;
};
export type AnimalDraftInput = {
  name: string;
  species: AnimalSpecies;
  size: "small" | "medium" | "large" | "extra_large";
  sex: "female" | "male" | "unknown";
  description: string;
  breed?: string;
  approximateBirthDate?: string;
  healthNotes?: string;
  behaviorNotes?: string;
  organizationId?: string;
  location: LocationInput;
  attributes?: AnimalAttributesInput;
};

/** Go stores attributes as free JSON; read only the documented fields. */
export function parseAnimalAttributes(value: unknown): AnimalAttributes | null {
  const result = animalAttributesSchema.safeParse(value);
  return result.success ? result.data : null;
}

const lifecycleMeta: ApiMutationMeta = {
  invalidates: [
    queryKeys.animals,
    queryKeys.preferences,
    queryKeys.organizations,
  ],
};

/** Deletion must not refetch the now hidden detail page before navigating away. */
const deleteMeta: ApiMutationMeta = {
  invalidates: [
    [...queryKeys.animals, "inventory"],
    [...queryKeys.animals, "feed"],
    [...queryKeys.animals, "list"],
    queryKeys.preferences,
    queryKeys.organizations,
  ],
};

/** Replace Go's generic conflict text with a message for this workflow. */
async function withConflictMessage<T>(
  request: Promise<T>,
  message: string,
): Promise<T> {
  try {
    return await request;
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 409)
      throw new ApiError(409, message, error.field, error.isInternal, false);
    throw error;
  }
}

const animalPath = (id: string, suffix = "") =>
  backendPath(`/v1/animals/${encodeURIComponent(id)}${suffix}`);

export const DISCOVER_PAGE_SIZE = 20;

export const animalQueries = {
  /** Public discovery (`GET /v1/animals`) with optional location and species filters. */
  discover: (
    page = 1,
    coordinates?: { lat: number; lon: number },
    species?: AnimalSpecies | null,
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(DISCOVER_PAGE_SIZE),
    });
    if (coordinates) {
      params.set("latitude", String(coordinates.lat));
      params.set("longitude", String(coordinates.lon));
    }
    if (species) params.set("species", species);
    return queryOptions({
      // Shares the `animals/list` prefix invalidated after animal changes.
      queryKey: [...queryKeys.animals, "list", params.toString()],
      queryFn: ({ signal }) =>
        requestData(
          backendPath(`/v1/animals?${params}`),
          collectionResponseListAvailableAnimalsRowSchema,
          { signal },
        ),
    });
  },
  history: (id: string) =>
    queryOptions({
      queryKey: [...queryKeys.animal(id), "history"],
      queryFn: ({ signal }) =>
        requestData(animalPath(id, "/history"), animalHistoryResponseSchema, {
          signal,
        }),
    }),
  interest: (id: string, page = 1) =>
    queryOptions({
      queryKey: [...queryKeys.animal(id), "interest", page],
      queryFn: ({ signal }) =>
        requestData(
          animalPath(id, `/interest?page=${page}&page_size=20`),
          interestResponseSchema,
          { signal },
        ),
    }),
  analytics: (organizationId: string) =>
    queryOptions({
      queryKey: [...queryKeys.organization(organizationId), "analytics"],
      queryFn: ({ signal }) =>
        requestData(
          backendPath(
            `/v1/organizations/${encodeURIComponent(organizationId)}/analytics`,
          ),
          organizationAnalyticsSchema,
          { signal },
        ),
    }),
  /** Inventory including archived animals (Go accepts `status=archived`). */
  inventory: (
    organizationId: string | undefined,
    status: InventoryStatus | undefined,
    page = 1,
  ) => {
    const params = new URLSearchParams({ page: String(page), page_size: "20" });
    if (organizationId && status) params.set("status", status);
    return queryOptions({
      queryKey: [...queryKeys.inventory(organizationId, status), page],
      queryFn: ({ signal }) =>
        requestData(
          backendPath(
            `${organizationId ? `/v1/organizations/${encodeURIComponent(organizationId)}/animals` : "/v1/me/animals"}?${params}`,
          ),
          collectionResponseAnimalSchema,
          { signal },
        ),
    });
  },
};

export const animalMutations = {
  save: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("save"),
      meta: lifecycleMeta,
      mutationFn: (input: { id?: string; animal: AnimalDraftInput }) => {
        if (!input.id)
          return requestData(
            backendPath("/v1/animals"),
            animalSchema,
            body(input.animal),
          );
        const changes = { ...input.animal };
        delete changes.organizationId;
        return requestData(
          animalPath(input.id),
          animalSchema,
          body(changes, "PATCH"),
        );
      },
    }),
  archive: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("archive"),
      meta: lifecycleMeta,
      mutationFn: (input: { id: string; reason: string }) =>
        withConflictMessage(
          requestData(
            animalPath(input.id, "/archive"),
            animalSchema,
            body({ reason: input.reason }),
          ),
          "Não é possível arquivar: há pedidos de adoção ativos para este animal. Conclua ou cancele os pedidos antes.",
        ),
    }),
  remove: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("delete"),
      meta: deleteMeta,
      mutationFn: (input: { id: string; reason: string }) =>
        withConflictMessage(
          requestData(
            animalPath(input.id),
            z.null(),
            body({ reason: input.reason }, "DELETE"),
          ),
          "Não é possível excluir: há pedidos de adoção ativos para este animal. Conclua ou cancele os pedidos antes.",
        ),
    }),
  assignOrganization: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("assign-organization"),
      meta: lifecycleMeta,
      mutationFn: (input: {
        id: string;
        organizationId: string;
        reason: string;
      }) =>
        withConflictMessage(
          requestData(
            animalPath(input.id, "/organization"),
            animalSchema,
            body(
              { organizationId: input.organizationId, reason: input.reason },
              "PUT",
            ),
          ),
          "Não foi possível trocar a ONG. Só é possível enquanto o encaminhamento aguarda análise, sem pedidos ou conversas, e para uma ONG verificada.",
        ),
    }),
  /** Upload bytes through Go media, then submit the stored URL for moderation. */
  uploadImage: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("image"),
      meta: lifecycleMeta,
      mutationFn: async (input: {
        id: string;
        file: File;
        altText: string;
        position: number;
      }) => {
        const media = await uploadMedia(input.file, "animal");
        return requestData(
          animalPath(input.id, "/images"),
          animalImageResponseSchema,
          body({
            url: media.url,
            altText: input.altText,
            position: input.position,
          }),
        );
      },
    }),
  startConversation: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("start-conversation"),
      meta: { invalidates: [queryKeys.conversations] },
      mutationFn: (input: { id: string; userId: string }) =>
        withConflictMessage(
          requestData(
            animalPath(input.id, "/conversations"),
            conversationSchema,
            body({ userId: input.userId }),
          ),
          "Não foi possível iniciar a conversa. O animal precisa estar disponível, a ONG publicada e a pessoa precisa ter curtido o animal e permitido o contato.",
        ),
    }),
};
