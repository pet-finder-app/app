"use client";
import { Button, FormError, LinkButton } from "@/components/ui";
import { queryKeys } from "@/lib/api/keys";
import { apiMutations } from "@/lib/api/mutations";
import { nextPageParam } from "@/lib/api/pagination";
import { myOrganizationsOptions } from "@/lib/api/queries";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VERIFICATION_LABELS } from "./labels";
import { QueryStatus } from "./query-status";

export function OrganizationSelection() {
  const router = useRouter();
  const client = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: queryKeys.organizationSelection,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      client.fetchQuery(myOrganizationsOptions(pageParam)),
    getNextPageParam: nextPageParam,
  });
  const mutation = useMutation(apiMutations.selectOrganization());
  const response = useMutation(apiMutations.respondToInvitation());
  const [error, setError] = useState<string | null>(null);
  async function select(id: string) {
    setError(null);
    try {
      await mutation.mutateAsync(id);
      router.push("/ngo/dashboard");
      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir a ONG.",
      );
    }
  }
  return (
    <>
      <p>
        Selecione a ONG que você representa. O acesso será confirmado antes de
        abrir a administração.
      </p>
      <QueryStatus query={query} />
      {query.data &&
      query.data.pages.every((page) => page.items.length === 0) ? (
        <p>Você ainda não tem vínculos com organizações.</p>
      ) : null}
      <FormError id="organization-selection-error">
        {error ?? response.error?.message}
      </FormError>
      {query.data?.pages
        .flatMap((page) => page.items)
        .map(({ organization, membershipStatus }) =>
          membershipStatus === "invited" ? (
            <div
              key={organization.id}
              className="flex flex-col gap-2 rounded-xl border border-border-light p-3"
            >
              <p>
                <span className="font-bold">{organization.name}</span> convidou
                você para a equipe. O convite só dá acesso depois de aceito.
              </p>
              <div className="flex gap-2">
                <Button
                  loading={response.isPending}
                  onClick={() =>
                    response.mutate({
                      organizationId: organization.id,
                      decision: "accepted",
                    })
                  }
                >
                  Aceitar convite
                </Button>
                <Button
                  variant="outline"
                  disabled={response.isPending}
                  onClick={() =>
                    response.mutate({
                      organizationId: organization.id,
                      decision: "declined",
                    })
                  }
                >
                  Recusar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              key={organization.id}
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => void select(organization.id)}
            >
              {organization.name} ·{" "}
              {VERIFICATION_LABELS[organization.verificationStatus] ??
                "Verificação não informada"}
            </Button>
          ),
        )}
      {query.hasNextPage ? (
        <Button
          onClick={() => void query.fetchNextPage()}
          loading={query.isFetchingNextPage}
        >
          Carregar mais organizações
        </Button>
      ) : null}
      <LinkButton href="/ngo/register">Cadastrar uma ONG</LinkButton>
    </>
  );
}
