"use client";

import { Button, FormError } from "@/components/ui";
import { queryKeys } from "@/lib/api/keys";
import { sessionOptions } from "@/lib/api/queries";
import { isPublicPath, loginUrl } from "@/lib/auth-redirect";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

type SessionGuardProps = { children: ReactNode };

export function SessionGuard({ children }: SessionGuardProps) {
  const pathname = usePathname();
  const isPublic = isPublicPath(pathname);
  const session = useQuery({ ...sessionOptions, enabled: !isPublic });
  const client = useQueryClient();
  const router = useRouter();
  const previousId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!session.data) return;
    const nextSession = session.data;
    const hasChangedAccount =
      previousId.current !== undefined && previousId.current !== nextSession.id;
    previousId.current = nextSession.id;
    if (hasChangedAccount) {
      client.clear();
      client.setQueryData(queryKeys.session, nextSession);
      router.refresh();
    }
  }, [session.data, client, router]);

  useEffect(() => {
    if (!isPublic)
      void client.invalidateQueries({ queryKey: queryKeys.session });
  }, [pathname, isPublic, client]);

  useEffect(() => {
    if (!isPublic && session.data === null) {
      const page = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      client.clear();
      router.replace(loginUrl(page));
      router.refresh();
    }
  }, [isPublic, session.data, client, router]);

  return (
    <>
      {!isPublic && session.isError ? (
        <div className="flex flex-col gap-3 p-4">
          <FormError id="session-error">
            Não foi possível verificar sua sessão. Tente novamente.
          </FormError>
          <Button onClick={() => void session.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {!isPublic && session.data === null ? (
        <p role="status" className="p-4 text-center">
          Redirecionando para entrar...
        </p>
      ) : (
        children
      )}
    </>
  );
}
