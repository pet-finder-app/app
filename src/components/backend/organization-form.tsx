"use client";
import { Button, FormError, Input, Textarea } from "@/components/ui";
import { apiMutations } from "@/lib/api/mutations";
import type {
  OrganizationResponse,
  UserResponse,
} from "@/lib/backend/contracts";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function OrganizationForm({
  organization,
  user,
}: {
  organization?: OrganizationResponse;
  user: UserResponse;
}) {
  const router = useRouter();
  const create = useMutation(apiMutations.createOrganization());
  const update = useMutation(apiMutations.updateOrganization());
  const select = useMutation(apiMutations.selectOrganization());
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: organization?.name ?? "",
    legalName: organization?.legalName ?? "",
    registrationNumber: organization?.registrationNumber ?? "",
    description: organization?.description ?? "",
    email: organization?.officialChannels.email ?? user.email,
    phone: organization?.officialChannels.phone ?? "",
    website: organization?.officialChannels.website ?? "",
    city: organization?.location?.city ?? user.location?.city ?? "",
    state: organization?.location?.state ?? user.location?.state ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isPending = create.isPending || update.isPending || select.isPending;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setError(null);
    setSaved(false);
    try {
      if (!organization && createdId) {
        await select.mutateAsync(createdId);
        router.push("/ngo/dashboard");
        router.refresh();
        return;
      }
      const input = {
        name: draft.name,
        legalName: draft.legalName,
        registrationNumber: draft.registrationNumber,
        description: draft.description,
        officialChannels: {
          email: draft.email,
          phone: draft.phone || undefined,
          website: draft.website || undefined,
        },
        location: {
          city: draft.city,
          state: draft.state,
          countryCode: organization?.location?.countryCode ?? "BR",
        },
      };
      if (organization) {
        await update.mutateAsync({ id: organization.id, changes: input });
        setSaved(true);
        router.refresh();
      } else {
        const created = await create.mutateAsync(input);
        setCreatedId(created.id);
        await select.mutateAsync(created.id);
        router.push("/ngo/dashboard");
        router.refresh();
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a ONG.",
      );
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        id="ngo-name"
        label="Nome da ONG"
        minLength={2}
        maxLength={120}
        required
        value={draft.name}
        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
      />
      {!organization ? (
        <>
          <Input
            id="ngo-legal-name"
            label="Razão social"
            required
            minLength={2}
            maxLength={180}
            value={draft.legalName}
            onChange={(event) =>
              setDraft({ ...draft, legalName: event.target.value })
            }
          />
          <Input
            id="ngo-registration-number"
            label="Número de registro / CNPJ"
            required
            minLength={8}
            maxLength={32}
            value={draft.registrationNumber}
            onChange={(event) =>
              setDraft({ ...draft, registrationNumber: event.target.value })
            }
          />
        </>
      ) : null}
      <Textarea
        id="ngo-description"
        label="Descrição"
        required
        minLength={20}
        maxLength={2000}
        value={draft.description}
        onChange={(event) =>
          setDraft({ ...draft, description: event.target.value })
        }
      />
      <Input
        id="ngo-email"
        label="E-mail oficial"
        type="email"
        required
        value={draft.email}
        onChange={(event) => setDraft({ ...draft, email: event.target.value })}
      />
      <Input
        id="ngo-phone"
        label="Telefone oficial"
        maxLength={30}
        value={draft.phone}
        onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
      />
      <Input
        id="ngo-website"
        label="Site oficial"
        type="url"
        value={draft.website}
        onChange={(event) =>
          setDraft({ ...draft, website: event.target.value })
        }
      />
      <Input
        id="ngo-city"
        label="Cidade"
        required
        maxLength={100}
        value={draft.city}
        onChange={(event) => setDraft({ ...draft, city: event.target.value })}
      />
      <Input
        id="ngo-state"
        label="Estado"
        required
        maxLength={8}
        value={draft.state}
        onChange={(event) => setDraft({ ...draft, state: event.target.value })}
      />
      <FormError id="ngo-form-error">{error}</FormError>
      {saved ? <p role="status">Alterações salvas.</p> : null}
      {!organization ? (
        <p>
          O cadastro será analisado antes da liberação para publicar animais.
        </p>
      ) : null}
      <Button type="submit" loading={isPending}>
        {organization
          ? "Salvar alterações"
          : createdId
            ? "Abrir ONG cadastrada"
            : "Cadastrar ONG"}
      </Button>
    </form>
  );
}
