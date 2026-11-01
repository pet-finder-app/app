"use client";

import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { api, result, type Schema } from "@/lib/api/client";
import {
  keys,
  useApiMutation,
  useMe,
  useOrganization,
  useOrganizationId,
} from "@/lib/api/queries";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AppFrame,
  ErrorMessage,
  field,
  LocationFields,
  locationFrom,
  QueryState,
  statusLabel,
} from "./common";

export function ProfileScreen() {
  const me = useMe();
  return (
    <AppFrame title="Meu perfil">
      {me.data && <ProfileForm key={me.data.id} user={me.data} />}
    </AppFrame>
  );
}

function ProfileForm({ user }: { user: Schema["UserResponse"] }) {
  const mutation = useApiMutation(
    (body: Schema["UpdateProfileRequest"]) =>
      result(api.PATCH("/v1/me", { body })),
    [keys.me],
  );
  return (
    <Card>
      <p className="text-sm">{user.email}</p>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          mutation.mutate({
            name: field(form, "name"),
            phone: field(form, "phone"),
            location: locationFrom(form),
          });
        }}
      >
        <Input
          id="name"
          label="Nome completo"
          defaultValue={user.name}
          minLength={2}
          maxLength={120}
          required
        />
        <Input
          id="phone"
          label="Telefone"
          type="tel"
          defaultValue={user.phone ?? ""}
          maxLength={30}
        />
        <LocationFields location={user.location} />
        <ErrorMessage error={mutation.error} />
        {mutation.isSuccess && <p role="status">Perfil atualizado.</p>}
        <Button type="submit" loading={mutation.isPending}>
          Salvar perfil
        </Button>
      </form>
    </Card>
  );
}

export function OrganizationSettingsScreen() {
  const [id, select] = useOrganizationId();
  const query = useOrganization(id);
  const [creating, setCreating] = useState(false);
  return (
    <AppFrame title="Configurações da ONG" organization>
      <Card>
        <Button variant="outline" onClick={() => setCreating(!creating)}>
          {creating ? "Fechar cadastro" : "Cadastrar uma organização"}
        </Button>
      </Card>
      {creating && (
        <OrganizationForm
          onCreated={(org) => {
            select(org.id);
            setCreating(false);
          }}
        />
      )}
      {id && (
        <>
          <QueryState query={query} />
          {query.data && (
            <>
              <Card>
                <h2 className="text-lg font-bold">{query.data.name}</h2>
                <p>
                  Verificação: {statusLabel(query.data.verification_status)}
                </p>
                <p className="text-xs break-all">ID: {query.data.id}</p>
                {query.data.verification_notes && (
                  <p>{query.data.verification_notes}</p>
                )}
              </Card>
              <OrganizationForm key={id} organization={query.data} />
              <Members organizationId={id} />
            </>
          )}
        </>
      )}
    </AppFrame>
  );
}

function OrganizationForm({
  organization,
  onCreated,
}: {
  organization?: Schema["OrganizationResponse"];
  onCreated?: (org: Schema["OrganizationResponse"]) => void;
}) {
  const mutation = useApiMutation(
    (body: Schema["CreateOrganizationRequest"]) =>
      organization
        ? result(
            api.PATCH("/v1/organizations/{organizationId}", {
              params: { path: { organizationId: organization.id } },
              body: {
                name: body.name,
                description: body.description,
                location: body.location,
                official_channels: body.official_channels,
              },
            }),
          )
        : result(api.POST("/v1/organizations", { body })),
    [keys.organizations],
  );
  return (
    <Card>
      <h2 className="font-bold">
        {organization ? "Perfil da organização" : "Cadastrar organização"}
      </h2>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          mutation.mutate(
            {
              name: field(form, "name"),
              legal_name: field(form, "legal_name"),
              registration_number: field(form, "registration_number"),
              description: field(form, "description"),
              official_channels: {
                email: field(form, "email"),
                phone: field(form, "phone") || undefined,
                website: field(form, "website") || undefined,
              },
              location: locationFrom(form),
            },
            { onSuccess: onCreated },
          );
        }}
      >
        <Input
          id="name"
          label="Nome da organização"
          defaultValue={organization?.name}
          minLength={2}
          maxLength={120}
          required
        />
        {!organization && (
          <>
            <Input
              id="legal_name"
              label="Razão social"
              minLength={2}
              maxLength={180}
              required
            />
            <Input
              id="registration_number"
              label="Documento de registro"
              minLength={8}
              maxLength={32}
              required
            />
          </>
        )}
        <Textarea
          id="description"
          label="Sobre a organização"
          minLength={20}
          maxLength={2000}
          defaultValue={organization?.description}
          required
        />
        <Input
          id="email"
          label="E-mail oficial"
          type="email"
          defaultValue={organization?.official_channels.email}
          maxLength={254}
          required
        />
        <Input
          id="phone"
          label="Telefone oficial"
          type="tel"
          maxLength={30}
          defaultValue={organization?.official_channels.phone ?? ""}
        />
        <Input
          id="website"
          label="Site oficial"
          type="url"
          defaultValue={organization?.official_channels.website ?? ""}
        />
        <LocationFields location={organization?.location} />
        <ErrorMessage error={mutation.error} />
        {mutation.isSuccess && <p role="status">Organização salva.</p>}
        <Button type="submit" loading={mutation.isPending}>
          Salvar organização
        </Button>
      </form>
      {!organization && (
        <p className="text-sm">
          O cadastro será enviado para verificação. A publicação de pets exige
          uma organização verificada.
        </p>
      )}
    </Card>
  );
}

function Members({ organizationId }: { organizationId: string }) {
  const params = { path: { organizationId } };
  const query = useQuery({
    queryKey: ["organizations", organizationId, "members"],
    queryFn: ({ signal }) =>
      result(
        api.GET("/v1/organizations/{organizationId}/members", {
          params,
          signal,
        }),
      ),
  });
  const invite = useApiMutation(
    (body: Schema["AddOrganizationMemberRequest"]) =>
      result(
        api.POST("/v1/organizations/{organizationId}/members", {
          params,
          body,
        }),
      ),
    [keys.organizations],
  );
  const remove = useApiMutation(
    (userId: string) =>
      result(
        api.DELETE("/v1/organizations/{organizationId}/members/{userId}", {
          params: { path: { organizationId, userId } },
        }),
      ),
    [keys.organizations],
  );
  return (
    <Card>
      <h2 className="font-bold">Equipe</h2>
      <QueryState query={query} />
      {query.data?.items?.map((member) => (
        <div key={member.id} className="flex flex-col gap-2">
          <p>
            {member.display_name} · {member.member_role}
          </p>
          <p className="text-xs">{member.email}</p>
          <Button
            variant="danger"
            size="sm"
            disabled={remove.isPending}
            onClick={() => {
              if (
                member.user_id &&
                window.confirm(`Remover ${member.display_name} da equipe?`)
              )
                remove.mutate(member.user_id);
            }}
          >
            Remover da equipe
          </Button>
        </div>
      ))}
      {query.isSuccess && !query.data.items?.length && (
        <p>Nenhum membro encontrado.</p>
      )}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          invite.mutate({
            email: field(form, "member-email"),
            role: field(
              form,
              "role",
            ) as Schema["AddOrganizationMemberRequest"]["role"],
          });
        }}
      >
        <Input
          id="member-email"
          label="E-mail do membro"
          type="email"
          maxLength={254}
          required
        />
        <Select
          id="role"
          label="Função"
          options={[
            { value: "coordinator", label: "Coordenação" },
            { value: "representative", label: "Representante" },
            { value: "moderator", label: "Moderação" },
          ]}
        />
        <ErrorMessage error={invite.error || remove.error} />
        {invite.isSuccess && <p role="status">Membro adicionado.</p>}
        <Button type="submit" loading={invite.isPending}>
          Adicionar membro
        </Button>
      </form>
    </Card>
  );
}
