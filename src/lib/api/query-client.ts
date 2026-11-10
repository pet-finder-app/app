import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./client";
import { queryKeys } from "./keys";
import type {} from "./meta";

export function createQueryClient(): QueryClient {
  const client = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (
          error instanceof ApiError &&
          error.isInternal &&
          error.isAuthenticationFailure
        )
          client.setQueryData(queryKeys.session, null);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (
          !mutation.meta?.isPublic &&
          error instanceof ApiError &&
          error.isInternal &&
          error.isAuthenticationFailure
        ) {
          client.setQueryData(queryKeys.session, null);
        }
      },
      onSuccess: async (_data, _variables, _context, mutation) => {
        if (mutation.meta?.resetsSession) {
          await client.cancelQueries();
          client.clear();
          return;
        }
        await Promise.all(
          (mutation.meta?.invalidates ?? []).map((queryKey) =>
            client.invalidateQueries({ queryKey }),
          ),
        );
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        retry: (count, error) =>
          !(error instanceof ApiError && error.status < 500) && count < 2,
      },
      mutations: { retry: false },
    },
  });
  return client;
}
