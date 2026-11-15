"use client";
import { Button, FormError, LinkButton } from "@/components/ui";
import { queryKeys } from "@/lib/api/keys";
import { apiMutations } from "@/lib/api/mutations";
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
    getNextPageParam: (last, _pages, page) =>
      last.items.length === 100 ? page + 1 : undefined,
  });
  const mutation = useMutation(apiMutations.selectOrganization());
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
      <FormError id="organization-selection-error">{error}</FormError>
      {query.data?.pages
        .flatMap((page) => page.items)
        .map(({ organization, membershipStatus }) => (
          <Button
            key={organization.id}
            variant="outline"
            disabled={mutation.isPending || membershipStatus !== "active"}
            onClick={() => void select(organization.id)}
          >
            {organization.name} ·{" "}
            {membershipStatus === "invited"
              ? "Convite pendente — sem acesso à administração"
              : (VERIFICATION_LABELS[organization.verificationStatus] ??
                "Verificação não informada")}
          </Button>
        ))}
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
