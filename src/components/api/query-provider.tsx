"use client";

import { createQueryClient } from "@/lib/api/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

type QueryProviderProps = { children: ReactNode };

export function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
