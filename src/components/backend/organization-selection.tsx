"use client";
import { Button, FormError, LinkButton } from "@/components/ui";
import { queryKeys } from "@/lib/api/keys";
import { apiMutations } from "@/lib/api/mutations";
import { organizationsOptions } from "@/lib/api/queries";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QueryStatus } from "./query-status";

export function OrganizationSelection() {
  const router = useRouter();
  const client = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: queryKeys.organizationSelection,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      client.fetchQuery(organizationsOptions(pageParam)),
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
      <p className="text-sm">
        A consulta das organizações pendentes vinculadas à conta ainda não está
        disponível. Cadastros iniciados neste navegador permanecem acessíveis
        pelo perfil.
      </p>
      <QueryStatus query={query} />
      <FormError id="organization-selection-error">{error}</FormError>
      {query.data?.pages
        .flatMap((page) => page.items)
        .map((organization) => (
          <Button
            key={organization.id}
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => void select(organization.id)}
          >
            {organization.name}
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
