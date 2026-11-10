import {
  animalDetailResponseSchema,
  applicationDetailResponseSchema,
  collectionResponseListAdopterApplicationsRowSchema,
  collectionResponseListAvailableAnimalsRowSchema,
  collectionResponseListOrganizationApplicationsRowSchema,
  collectionResponseListOrganizationConversationsRowSchema,
  collectionResponseListPreferredAnimalsRowSchema,
  collectionResponseListUserConversationsRowSchema,
  collectionResponseMessageSchema,
  collectionResponseOrganizationResponseSchema,
  memberListResponseSchema,
  organizationResponseSchema,
} from "@/lib/backend/contracts";
import { sessionSchema } from "@/lib/session";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { ApiError, requestData } from "./client";
import { queryKeys } from "./keys";

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
export function animalsOptions(
  page = 1,
  coordinates?: { lat: number; lon: number },
) {
  const params = new URLSearchParams({ page: String(page), page_size: "20" });
  if (coordinates) {
    params.set("latitude", String(coordinates.lat));
    params.set("longitude", String(coordinates.lon));
  }
  return queryOptions({
    queryKey: [...queryKeys.animals, "list", params.toString()],
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/animals?${params}`),
        collectionResponseListAvailableAnimalsRowSchema,
        { signal },
      ),
  });
}
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
export function applicationsOptions(organizationId?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), page_size: "100" });
  if (organizationId) params.set("organization_id", organizationId);
  return queryOptions({
    queryKey: [...queryKeys.applicationList(organizationId), page],
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
export function messagesOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.messages(id),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(
          `/v1/conversations/${encodeURIComponent(id)}/messages?page_size=100`,
        ),
        collectionResponseMessageSchema,
        { signal },
      ),
    staleTime: 0,
    refetchInterval: 4_000,
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
