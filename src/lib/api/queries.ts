import {
  animalDetailResponseSchema,
  applicationDetailResponseSchema,
  appointmentDetailResponseSchema,
  appointmentListResponseSchema,
  collectionResponseAnimalSchema,
  collectionResponseListAdopterApplicationsRowSchema,
  collectionResponseListOrganizationApplicationsRowSchema,
  collectionResponseListOrganizationConversationsRowSchema,
  collectionResponseListPreferredAnimalsRowSchema,
  collectionResponseListUserConversationsRowSchema,
  collectionResponseMemberOrganizationResponseSchema,
  collectionResponseMessageSchema,
  collectionResponseOrganizationResponseSchema,
  collectionResponseVerificationReviewItemSchema,
  memberListResponseSchema,
  organizationResponseSchema,
  paymentDetailsSchema,
  verificationHistorySchema,
  verificationRequirementsSchema,
  verificationReviewItemSchema,
} from "@/lib/backend/contracts";
import { sessionSchema } from "@/lib/session";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { ApiError, requestData } from "./client";
import { queryKeys } from "./keys";
import { nextPageParam } from "./pagination";

export const backendPath = (path: string) => `/api/backend${path}`;
export const sessionOptions = queryOptions({
  queryKey: queryKeys.session,
  queryFn: async ({ signal }) => {
    try {
      return await requestData("/api/session/me", sessionSchema, { signal });
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  staleTime: 0,
  refetchInterval: 60_000,
});
export function animalOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.animal(id),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/animals/${encodeURIComponent(id)}`),
        animalDetailResponseSchema,
        { signal },
      ),
  });
}
export function preferencesOptions(
  value: "liked" | "not_interested",
  page = 1,
) {
  return queryOptions({
    queryKey: queryKeys.preference(value, page),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(
          `/v1/preferences?value=${value}&page=${page}&page_size=100`,
        ),
        collectionResponseListPreferredAnimalsRowSchema,
        { signal },
      ),
  });
}
export function organizationsOptions(page = 1) {
  return queryOptions({
    queryKey: [...queryKeys.organizations, "list", page],
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/organizations?page=${page}&page_size=100`),
        collectionResponseOrganizationResponseSchema,
        { signal },
      ),
  });
}
export function myOrganizationsOptions(page = 1) {
  return queryOptions({
    queryKey: [...queryKeys.myOrganizations, page],
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/me/organizations?page=${page}&page_size=100`),
        collectionResponseMemberOrganizationResponseSchema,
        { signal },
      ),
  });
}
export type AnimalInventoryStatus =
  | "pending_organization"
  | "available"
  | "adoption_in_progress"
  | "adopted"
  | "unavailable"
  | "under_review";
export function animalInventoryOptions(
  organizationId?: string,
  status?: AnimalInventoryStatus,
  page = 1,
) {
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
}
export function organizationOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.organization(id),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/organizations/${encodeURIComponent(id)}`),
        organizationResponseSchema,
        { signal },
      ),
  });
}
export function membersOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.members(id),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/organizations/${encodeURIComponent(id)}/members`),
        memberListResponseSchema,
        { signal },
      ),
  });
}
export type ApplicationFilters = {
  /** Go application status, e.g. "completed". */
  status?: string;
  /** Organization listings only: applications for this animal. */
  animalId?: string;
};
export function applicationsOptions(
  organizationId?: string,
  page = 1,
  filters: ApplicationFilters = {},
) {
  const params = new URLSearchParams({ page: String(page), page_size: "100" });
  if (organizationId) params.set("organization_id", organizationId);
  if (filters.status) params.set("status", filters.status);
  if (filters.animalId) params.set("animal_id", filters.animalId);
  return queryOptions({
    queryKey: [
      ...queryKeys.applicationList(organizationId),
      page,
      filters.status ?? "",
      filters.animalId ?? "",
    ],
    queryFn: async ({ signal }) => {
      if (organizationId)
        return requestData(
          backendPath(`/v1/applications?${params}`),
          collectionResponseListOrganizationApplicationsRowSchema,
          { signal },
        );
      return requestData(
        backendPath(`/v1/applications?${params}`),
        collectionResponseListAdopterApplicationsRowSchema,
        { signal },
      );
    },
  });
}
export function applicationOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.application(id),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/applications/${encodeURIComponent(id)}`),
        applicationDetailResponseSchema,
        { signal },
      ),
  });
}
export function conversationsOptions(organizationId?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), page_size: "100" });
  if (organizationId) params.set("organization_id", organizationId);
  return queryOptions({
    queryKey: [...queryKeys.conversationList(organizationId), page],
    queryFn: async ({ signal }) => {
      if (organizationId)
        return requestData(
          backendPath(`/v1/conversations?${params}`),
          collectionResponseListOrganizationConversationsRowSchema,
          { signal },
        );
      return requestData(
        backendPath(`/v1/conversations?${params}`),
        collectionResponseListUserConversationsRowSchema,
        { signal },
      );
    },
    refetchInterval: 15_000,
  });
}
/** Poll only while the real-time channel is unavailable. */
export function messageHistoryOptions(id: string, isLive = false) {
  return infiniteQueryOptions({
    queryKey: [...queryKeys.messages(id), "history"],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ page_size: "100" });
      if (pageParam) params.set("before", pageParam);
      return requestData(
        backendPath(
          `/v1/conversations/${encodeURIComponent(id)}/messages?${params}`,
        ),
        collectionResponseMessageSchema,
        { signal },
      );
    },
    getNextPageParam: (last) =>
      last.items.length === 100 ? last.items.at(-1)?.id : undefined,
    staleTime: 0,
    refetchInterval: isLive ? false : 4_000,
  });
}
export function applicationAppointmentsOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.applicationAppointments(id),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/applications/${encodeURIComponent(id)}/appointments`),
        appointmentListResponseSchema,
        { signal },
      ),
  });
}
export function appointmentOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.appointment(id),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/appointments/${encodeURIComponent(id)}`),
        appointmentDetailResponseSchema,
        { signal },
      ),
  });
}
export const locationOptions = queryOptions({
  queryKey: queryKeys.location,
  queryFn: ({ signal }) =>
    requestData(
      "/api/location",
      z.object({
        enabled: z.boolean(),
        coordinates: z.object({ lat: z.number(), lon: z.number() }).nullable(),
      }),
      { signal },
    ),
});

/** Personal verification without an organization, or that organization's. */
const verificationBase = (organizationId?: string) =>
  organizationId
    ? `/v1/organizations/${encodeURIComponent(organizationId)}`
    : "/v1/me";
export function verificationRequirementsOptions(organizationId?: string) {
  return queryOptions({
    queryKey: [...queryKeys.verification(organizationId), "requirements"],
    queryFn: ({ signal }) =>
      requestData(
        backendPath(
          `${verificationBase(organizationId)}/${organizationId ? "verification-requirements" : "verification/requirements"}`,
        ),
        verificationRequirementsSchema,
        { signal },
      ),
    staleTime: 5 * 60_000,
  });
}
export function verificationHistoryOptions(organizationId?: string) {
  return queryOptions({
    queryKey: [...queryKeys.verification(organizationId), "history"],
    queryFn: ({ signal }) =>
      requestData(
        backendPath(
          `${verificationBase(organizationId)}/${organizationId ? "verification-submissions" : "verification"}`,
        ),
        verificationHistorySchema,
        { signal },
      ),
  });
}
export function verificationQueueOptions(status: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), page_size: "50" });
  if (status) params.set("status", status);
  return queryOptions({
    queryKey: queryKeys.verificationQueue(status, page),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/verifications?${params}`),
        collectionResponseVerificationReviewItemSchema,
        { signal },
      ),
  });
}
export function verificationReviewOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.verificationReview(id),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/verifications/${encodeURIComponent(id)}`),
        verificationReviewItemSchema,
        { signal },
      ),
  });
}

/** Donation instructions, or null while the organization has none. */
export function paymentDetailsOptions(organizationId: string) {
  return queryOptions({
    queryKey: queryKeys.paymentDetails(organizationId),
    queryFn: async ({ signal }) => {
      try {
        return await requestData(
          backendPath(
            `/v1/organizations/${encodeURIComponent(organizationId)}/payment-details`,
          ),
          paymentDetailsSchema,
          { signal },
        );
      } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });
}

/** The adopter's completed adoptions, page by page (e.g. to request a return). */
export function completedAdoptionsOptions() {
  return infiniteQueryOptions({
    queryKey: [...queryKeys.applicationList(), "completed", "pages"],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        page_size: "50",
        status: "completed",
      });
      return requestData(
        backendPath(`/v1/applications?${params}`),
        collectionResponseListAdopterApplicationsRowSchema,
        { signal },
      );
    },
    getNextPageParam: nextPageParam,
  });
}
