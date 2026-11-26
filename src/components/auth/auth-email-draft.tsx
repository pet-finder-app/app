"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type AuthEmailDraft = readonly [string, Dispatch<SetStateAction<string>>];

const AuthEmailDraftContext = createContext<AuthEmailDraft | null>(null);

type AuthEmailDraftProviderProps = { children: ReactNode };

/** Share the typed e-mail across sign-in, registration and recovery screens. */
export function AuthEmailDraftProvider({
  children,
}: AuthEmailDraftProviderProps) {
  const draft = useState("");
  return (
    <AuthEmailDraftContext value={draft}>{children}</AuthEmailDraftContext>
  );
}

/** The shared e-mail draft, or local state outside the authentication layout. */
export function useAuthEmailDraft(): AuthEmailDraft {
  const local = useState("");
  return useContext(AuthEmailDraftContext) ?? local;
}
