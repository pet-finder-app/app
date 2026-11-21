"use client";
import {
  AnimalAttributesFields,
  attributesDraftFrom,
  attributesInputFrom,
} from "@/components/animals/animal-attributes-fields";
import { SPECIES_LABELS } from "@/components/animals/animal-labels";
import { AnimalLifecyclePanel } from "@/components/animals/animal-lifecycle-panel";
import { Button, FormError, Input, Select, Textarea } from "@/components/ui";
import {
  ANIMAL_SPECIES,
  animalMutations,
  animalSpeciesSchema,
  parseAnimalAttributes,
  type AnimalDraftInput,
} from "@/lib/api/animals";
import { apiMutations, IMAGE_TYPES } from "@/lib/api/mutations";
import { animalOptions, organizationsOptions } from "@/lib/api/queries";
import type {
  Animal,
  OrganizationResponse,
  UserResponse,
} from "@/lib/backend/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AnimalImageManager } from "./animal-image-manager";
import { QueryStatus } from "./query-status";

const sex = z.enum(["male", "female", "unknown"]);
const size = z.enum(["small", "medium", "large", "extra_large"]);
function AnimalEditor({
  initial,
  organization,
  user,
  isPrivate,
}: {
  initial?: Animal;
  organization?: OrganizationResponse | null;
  user: UserResponse;
  isPrivate?: boolean;
}) {
  const router = useRouter();
  const save = useMutation(animalMutations.save());
  const image = useMutation(animalMutations.uploadImage());
  const status = useMutation(apiMutations.animalStatus());
  const organizations = useQuery({
    ...organizationsOptions(),
    enabled: Boolean(isPrivate && !initial),
  });
  const [savedId, setSavedId] = useState(initial?.id);
  const [draft, setDraft] = useState<AnimalDraftInput>({
    name: initial?.name ?? "",
    species: animalSpeciesSchema
      .catch("other")
      .parse(initial?.species ?? "dog"),
    sex: sex.parse(initial?.sex ?? "unknown"),
    size: size.parse(initial?.size ?? "medium"),
    description: initial?.description ?? "",
    breed: initial?.breed ?? "",
    approximateBirthDate: initial?.birthDate ?? undefined,
    healthNotes: initial?.healthNotes ?? "",
    behaviorNotes: initial?.behaviorNotes ?? "",
    organizationId: initial?.responsibleOrganizationId ?? organization?.id,
    location: {
      city:
        initial?.city ??
        organization?.location?.city ??
        user.location?.city ??
        "",
      state:
        initial?.stateCode ??
        organization?.location?.state ??
        user.location?.state ??
        "",
      countryCode: initial?.countryCode ?? "BR",
    },
  });
  const [attributes, setAttributes] = useState(() =>
    attributesDraftFrom(
      initial ? parseAnimalAttributes(initial.attributes) : null,
      initial,
    ),
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isPending = save.isPending || image.isPending || status.isPending;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setError(null);
    try {
      const animal = await save.mutateAsync({
        id: savedId,
        animal: { ...draft, attributes: attributesInputFrom(attributes) },
      });
      setSavedId(animal.id);
      if (photo) {
        try {
          await image.mutateAsync({
            id: animal.id,
            file: photo,
            altText: animal.name,
            position: 0,
          });
        } catch (error: unknown) {
          setError(
            `O animal foi salvo, mas a foto não pôde ser enviada para análise. ${error instanceof Error ? error.message : "Tente novamente."}`,
          );
          return;
        }
      }
      router.push(`/pets/${animal.id}`);
      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o animal.",
      );
    }
  }
  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {isPrivate && !initial ? (
          <>
            <QueryStatus query={organizations} />
            <Select
              id="animal-organization"
              label="ONG responsável"
              required
              placeholder="Escolha uma ONG"
              value={draft.organizationId ?? ""}
              options={(organizations.data?.items ?? []).map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(event) =>
                setDraft({ ...draft, organizationId: event.target.value })
              }
            />
            <p>O animal será enviado para análise da organização.</p>
          </>
        ) : null}
        <Input
          id="animal-name"
          label="Nome"
          required
          maxLength={100}
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
        <Select
          id="animal-species"
          label="Espécie"
          value={draft.species}
          options={ANIMAL_SPECIES.map((value) => ({
            value,
            label: SPECIES_LABELS[value],
          }))}
          onChange={(event) =>
            setDraft({
              ...draft,
              species: animalSpeciesSchema.parse(event.target.value),
            })
          }
        />
        <Select
          id="animal-sex"
          label="Sexo"
          value={draft.sex}
          options={[
            { value: "unknown", label: "Não informado" },
            { value: "male", label: "Macho" },
            { value: "female", label: "Fêmea" },
          ]}
          onChange={(event) =>
            setDraft({ ...draft, sex: sex.parse(event.target.value) })
          }
        />
        <Select
          id="animal-size"
          label="Porte"
          value={draft.size}
          options={[
            { value: "small", label: "Pequeno" },
            { value: "medium", label: "Médio" },
            { value: "large", label: "Grande" },
            { value: "extra_large", label: "Muito grande" },
          ]}
          onChange={(event) =>
            setDraft({ ...draft, size: size.parse(event.target.value) })
          }
        />
        <Input
          id="animal-breed"
          label="Raça (opcional)"
          value={draft.breed ?? ""}
          onChange={(event) =>
            setDraft({ ...draft, breed: event.target.value })
          }
        />
        <Input
          id="animal-birth"
          label="Nascimento aproximado (opcional)"
          type="date"
          value={draft.approximateBirthDate ?? ""}
          onChange={(event) =>
            setDraft({
              ...draft,
              approximateBirthDate: event.target.value || undefined,
            })
          }
        />
        <Textarea
          id="animal-description"
          label="Descrição"
          required
          minLength={20}
          maxLength={5000}
          value={draft.description}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
        />
        <Textarea
          id="animal-health"
          label="Saúde"
          maxLength={3000}
          value={draft.healthNotes ?? ""}
          onChange={(event) =>
            setDraft({ ...draft, healthNotes: event.target.value })
          }
        />
        <Textarea
          id="animal-behavior"
          label="Comportamento"
          maxLength={3000}
          value={draft.behaviorNotes ?? ""}
          onChange={(event) =>
            setDraft({ ...draft, behaviorNotes: event.target.value })
          }
        />
        <Input
          id="animal-city"
          label="Cidade"
          required
          maxLength={100}
          value={draft.location.city}
          onChange={(event) =>
            setDraft({
              ...draft,
              location: { ...draft.location, city: event.target.value },
            })
          }
        />
        <Input
          id="animal-state"
          label="Estado"
          required
          maxLength={8}
          value={draft.location.state}
          onChange={(event) =>
            setDraft({
              ...draft,
              location: { ...draft.location, state: event.target.value },
            })
          }
        />
        <AnimalAttributesFields value={attributes} onChange={setAttributes} />
        {initial ? null : (
          <label
            htmlFor="animal-photo"
            className="flex flex-col gap-1 font-medium"
          >
            Foto do animal (opcional)
            <input
              id="animal-photo"
              type="file"
              accept={IMAGE_TYPES.join(",")}
              aria-describedby="animal-photo-hint"
              className="text-sm"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
            <span id="animal-photo-hint" className="text-sm text-neutral-600">
              JPEG, PNG ou WebP de até 10 MB. A foto será analisada antes de
              aparecer na galeria pública.
            </span>
          </label>
        )}
        <FormError id="animal-save-error">{error}</FormError>
        <Button type="submit" loading={isPending}>
          Salvar animal
        </Button>
      </form>
      {initial &&
      initial.status !== "archived" &&
      organization?.id === initial.responsibleOrganizationId ? (
        <div className="mt-4 flex flex-col gap-3">
          <Input
            id="animal-status-reason"
            label="Motivo da alteração de disponibilidade"
            required
            minLength={5}
            maxLength={1000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <Button
            variant="outline"
            loading={status.isPending}
            disabled={reason.trim().length < 5}
            onClick={() =>
              status.mutate({
                id: initial.id,
                status:
                  initial.status === "available" ? "unavailable" : "available",
                reason,
              })
            }
          >
            {initial.status === "available"
              ? "Marcar como indisponível"
              : "Publicar como disponível"}
          </Button>
          <FormError id="animal-status-error">
            {status.error?.message}
          </FormError>
          {status.isSuccess ? (
            <p role="status">Disponibilidade atualizada.</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
export function AnimalForm({
  id,
  organization,
  user,
  isPrivate,
}: {
  id?: string;
  organization?: OrganizationResponse | null;
  user: UserResponse;
  isPrivate?: boolean;
}) {
  const query = useQuery({ ...animalOptions(id ?? ""), enabled: Boolean(id) });
  if (!id)
    return (
      <AnimalEditor
        organization={organization}
        user={user}
        isPrivate={isPrivate}
      />
    );
  return (
    <>
      <QueryStatus query={query} />
      {query.data ? (
        <>
          <AnimalEditor
            initial={query.data.animal}
            organization={organization}
            user={user}
          />
          <AnimalImageManager
            data={query.data}
            user={user}
            selectedOrganizationId={organization?.id}
          />
          <AnimalLifecyclePanel
            animal={query.data.animal}
            user={user}
            selectedOrganizationId={organization?.id}
          />
        </>
      ) : null}
    </>
  );
}
