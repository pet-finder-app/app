import type { QueryKey } from "@tanstack/react-query";

export interface ApiMutationMeta extends Record<string, unknown> {
  isPublic?: boolean;
  resetsSession?: boolean;
  invalidates?: readonly QueryKey[];
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: ApiMutationMeta;
  }
}
