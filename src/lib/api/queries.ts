"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { api, ApiError, result, type Schema } from "./client";

export const keys = {
  me: ["me"] as const,
  animals: ["animals"] as const,
  preferences: ["preferences"] as const,
  organizations: ["organizations"] as const,
  applications: ["applications"] as const,
  conversations: ["conversations"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: async () => {
      try {
        return await result(api.GET("/v1/me"));
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
  });
}

// Only an interface preference is stored locally; server permissions always decide access.
const ORG_KEY = "petfinder.organization";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};
export function useOrganizationId() {
  const id = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(ORG_KEY) ?? "",
    () => "",
  );
  const client = useQueryClient();
  function select(value: string) {
    localStorage.setItem(ORG_KEY, value);
    window.dispatchEvent(new Event("storage"));
    void client.invalidateQueries();
  }
  return [id, select] as const;
}

export function useApiMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  invalidate: readonly (readonly unknown[])[],
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(
        invalidate.map((queryKey) => client.invalidateQueries({ queryKey })),
      );
    },
  });
}

export type AnimalFilters = {
  species?: "dog" | "cat" | "other";
  size?: "small" | "medium" | "large" | "extra_large";
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
};
export function useAnimals(
  page: number,
  filters: AnimalFilters,
  preference?: "liked" | "not_interested",
) {
  return useQuery<{
    items: Schema["Animal"][] | null;
    page: Schema["PageResponse"];
  }>({
    queryKey: [
      preference ? "preferences" : "animals",
      preference,
      page,
      filters,
    ],
    queryFn: ({ signal }) =>
      preference
        ? result(
            api.GET("/v1/preferences", {
              params: { query: { page, page_size: 12, value: preference } },
              signal,
            }),
          )
        : result(
            api.GET("/v1/animals", {
              params: { query: { page, page_size: 12, ...filters } },
              signal,
            }),
          ),
  });
}

export function useAnimal(id: string) {
  return useQuery({
    queryKey: ["animals", id],
    enabled: !!id,
    queryFn: ({ signal }) =>
      result(
        api.GET("/v1/animals/{animalId}", {
          params: { path: { animalId: id } },
          signal,
        }),
      ),
  });
}

export function useOrganizations(page: number) {
  return useQuery({
    queryKey: ["organizations", "list", page],
    queryFn: ({ signal }) =>
      result(
        api.GET("/v1/organizations", {
          params: { query: { page, page_size: 12 } },
          signal,
        }),
      ),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ["organizations", id],
    enabled: !!id,
    queryFn: ({ signal }) =>
      result(
        api.GET("/v1/organizations/{organizationId}", {
          params: { path: { organizationId: id } },
          signal,
        }),
      ),
  });
}

export function useApplications(page: number, organizationId?: string) {
  return useQuery({
    queryKey: ["applications", "list", page, organizationId],
    queryFn: ({ signal }) =>
      result(
        api.GET("/v1/applications", {
          params: {
            query: {
              page,
              page_size: 12,
              organization_id: organizationId || undefined,
            },
          },
          signal,
        }),
      ),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ["applications", id],
    queryFn: ({ signal }) =>
      result(
        api.GET("/v1/applications/{applicationId}", {
          params: { path: { applicationId: id } },
          signal,
        }),
      ),
  });
}

// The contract describes the adopter list response for these polymorphic endpoints.
// Organization rows share all common fields and add counterparty/adopter names.
export type ConversationRow = Schema["ListUserConversationsRow"] &
  Partial<
    Pick<Schema["ListOrganizationConversationsRow"], "counterparty_name">
  >;
export function useConversations(page: number, organizationId?: string) {
  return useQuery({
    queryKey: ["conversations", "list", page, organizationId],
    refetchInterval: 15000,
    queryFn: ({ signal }) =>
      result(
        api.GET("/v1/conversations", {
          params: {
            query: {
              page,
              page_size: 12,
              organization_id: organizationId || undefined,
            },
          },
          signal,
        }),
      ),
  });
}

export function useMessages(id: string) {
  return useQuery({
    queryKey: ["conversations", id, "messages"],
    refetchInterval: 5000,
    queryFn: ({ signal }) =>
      result(
        api.GET("/v1/conversations/{conversationId}/messages", {
          params: { path: { conversationId: id }, query: { page_size: 100 } },
          signal,
        }),
      ),
  });
}
