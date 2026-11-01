"use client";

import {
  Button,
  Card,
  FormError,
  Input,
  LinkButton,
  PageShell,
} from "@/components/ui";
import { ApiError, session, type Schema } from "@/lib/api/client";
import { useMe, useOrganizationId } from "@/lib/api/queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";

export function ErrorMessage({ error }: { error: unknown }) {
  const id = useId();
  return (
    <FormError id={id} collapsible>
      {!error
        ? null
        : error instanceof ApiError && error.isAuthenticationError
          ? "Sua sessão expirou. Entre novamente."
          : error instanceof Error
            ? error.message
            : "Não foi possível concluir a operação."}
    </FormError>
  );
}

export function QueryState({
  query,
}: {
  query: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => unknown;
  };
}) {
  if (query.isPending) return <p role="status">Carregando…</p>;
  if (!query.isError) return null;
  return (
    <Card>
      <ErrorMessage error={query.error} />
      <Button variant="outline" onClick={() => void query.refetch()}>
        Tentar novamente
      </Button>
    </Card>
  );
}

export function Pagination({
  page,
  count,
  pageSize = 12,
  onPage,
}: {
  page: number;
  count: number;
  pageSize?: number;
  onPage: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-3"
    >
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Anterior
      </Button>
      <span>Página {page}</span>
      <Button
        variant="outline"
        disabled={count < pageSize}
        onClick={() => onPage(page + 1)}
      >
        Próxima
      </Button>
    </nav>
  );
}

export function AppFrame({
  title,
  children,
  organization = false,
}: {
  title: string;
  children: ReactNode;
  organization?: boolean;
}) {
  const me = useMe();
  const client = useQueryClient();
  const router = useRouter();
  const logout = useMutation({
    mutationFn: () => session("logout"),
    onSuccess: () => {
      client.clear();
      localStorage.removeItem("petfinder.organization");
      window.dispatchEvent(new Event("storage"));
      router.replace("/login");
    },
  });
  return (
    <PageShell hasActionBar>
      <Card as="header">
        <Link href="/" className="font-brand text-3xl">
          PETFINDER.
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">{title}</h1>
          {me.data && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => logout.mutate()}
              loading={logout.isPending}
            >
              Sair
            </Button>
          )}
        </div>
        <ErrorMessage error={logout.error} />
        {me.data && <p className="text-sm text-neutral-600">{me.data.name}</p>}
      </Card>
      <QueryState query={me} />
      {me.data ? (
        <>
          {organization && <OrganizationPicker />}
          {children}
        </>
      ) : !me.isPending && !me.isError ? (
        <Card>
          <p>Entre para acessar o Petfinder.</p>
          <LinkButton href="/login">Entrar</LinkButton>
          <LinkButton href="/register" variant="outline">
            Criar conta
          </LinkButton>
        </Card>
      ) : null}
      <nav
        aria-label="Navegação principal"
        className="flex flex-wrap gap-2 text-sm font-bold"
      >
        {[
          ["/", "Descobrir"],
          ["/adopter/favorites", "Favoritos"],
          ["/adopter/adoptions", "Adoções"],
          ["/adopter/conversations", "Conversas"],
          ["/me", "Perfil"],
          ["/ngos", "Organizações"],
          ["/adopter/surrenders/new", "Oferecer um pet"],
          ["/ngo/dashboard", "Área da ONG"],
        ].map(([href, label]) => (
          <LinkButton key={href} href={href} variant="pill" size="sm">
            {label}
          </LinkButton>
        ))}
      </nav>
    </PageShell>
  );
}

export function OrganizationPicker() {
  const [id, select] = useOrganizationId();
  const [draft, setDraft] = useState(id);
  return (
    <Card>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          select(draft.trim());
        }}
      >
        <Input
          id="organization-id"
          label="ID da organização"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="UUID da organização"
          required
          pattern="[0-9a-fA-F-]{36}"
          hint="Use o ID recebido no cadastro ou informado pela sua equipe."
        />
        <Button size="sm" type="submit">
          Selecionar organização
        </Button>
      </form>
      {id && <p className="text-xs break-all">Selecionada: {id}</p>}
      <nav className="flex flex-wrap gap-2">
        {[
          ["/ngo/pets", "Pets"],
          ["/ngo/adoptions", "Adoções"],
          ["/ngo/messages", "Conversas"],
          ["/ngo/settings", "Configurações"],
        ].map(([href, label]) => (
          <LinkButton key={href} href={href} variant="pill" size="sm">
            {label}
          </LinkButton>
        ))}
      </nav>
    </Card>
  );
}

export function LocationFields({
  location,
}: {
  location?: Schema["LocationResponse"] | Schema["LocationInput"] | null;
}) {
  return (
    <>
      <Input
        id="city"
        label="Cidade"
        defaultValue={location?.city ?? ""}
        maxLength={100}
        required
      />
      <Input
        id="state"
        label="Estado / UF"
        defaultValue={location?.state ?? ""}
        maxLength={8}
        required
      />
      <Input
        id="country_code"
        label="País (código ISO)"
        defaultValue={location?.country_code ?? "BR"}
        pattern="[A-Z]{2}"
        maxLength={2}
        required
      />
    </>
  );
}
export const field = (form: FormData, name: string) =>
  String(form.get(name) ?? "").trim();
export const locationFrom = (form: FormData): Schema["LocationInput"] => ({
  city: field(form, "city"),
  state: field(form, "state"),
  country_code: field(form, "country_code"),
});
export const dateLabel = (value?: string | null) =>
  value ? new Date(value).toLocaleString("pt-BR") : "";

const statusLabels: Record<string, string> = {
  available: "Disponível",
  pending_organization: "Aguardando organização",
  adoption_in_progress: "Em adoção",
  unavailable: "Indisponível",
  under_review: "Em análise",
  adopted: "Adotado",
  submitted: "Enviada",
  screening: "Triagem",
  more_information_requested: "Mais informações solicitadas",
  approved: "Aprovada",
  rejected: "Recusada",
  withdrawn: "Retirada",
  completed: "Concluída",
  cancelled: "Cancelada",
  verified: "Verificada",
  pending: "Pendente",
  suspended: "Suspensa",
};
export const statusLabel = (status: string) => statusLabels[status] ?? status;

export function UnsupportedFeature({ title }: { title: string }) {
  return (
    <PageShell>
      <Card>
        <h1 className="text-xl font-bold">{title}</h1>
        <p>Este recurso ainda não está disponível no serviço Petfinder.</p>
        <LinkButton href="/">Voltar ao início</LinkButton>
      </Card>
    </PageShell>
  );
}
