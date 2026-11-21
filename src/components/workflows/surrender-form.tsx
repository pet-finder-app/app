"use client";
import { QueryStatus } from "@/components/backend/query-status";
import { Button, FormError, Select, Textarea } from "@/components/ui";
import {
  completedAdoptionsOptions,
  organizationsOptions,
} from "@/lib/api/queries";
import {
  ownAnimalsOptions,
  workflowMutations,
  type SurrenderInput,
} from "@/lib/api/workflows";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AnimalFields, cleanAnimal, EMPTY_ANIMAL } from "./animal-fields";
import { EvidenceUpload, type UploadedEvidence } from "./evidence-upload";

type SurrenderFormProps = {
  /** Preselects a return of this completed adoption. */
  initialApplicationId?: string;
};

/**
 * Opens an intake (give an animal to a verified organization) or a return
 * (the current adopter gives an adopted animal back to its organization).
 */
export function SurrenderForm({ initialApplicationId }: SurrenderFormProps) {
  const router = useRouter();
  const create = useMutation(workflowMutations.createSurrender());
  const [kind, setKind] = useState<SurrenderInput["kind"]>(
    initialApplicationId ? "return" : "intake",
  );
  const [applicationId, setApplicationId] = useState(
    initialApplicationId ?? "",
  );
  const [organizationId, setOrganizationId] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [animal, setAnimal] = useState(EMPTY_ANIMAL);
  const [reason, setReason] = useState("");
  const [documents, setDocuments] = useState<UploadedEvidence[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const applications = useInfiniteQuery({
    ...completedAdoptionsOptions(),
    enabled: kind === "return",
  });
  const organizations = useQuery({
    ...organizationsOptions(),
    enabled: kind === "intake",
  });
  const inventory = useInfiniteQuery({
    ...ownAnimalsOptions(),
    enabled: kind === "intake",
  });
  const loadedAnimals = inventory.data?.pages.flatMap((page) => page.items);
  const animalTotal = inventory.data?.pages[0]?.page.total ?? 0;
  const completedTotal = applications.data?.pages[0]?.page.total ?? 0;
  const completed = (
    applications.data?.pages.flatMap((page) => page.items) ?? []
  ).flatMap((item) =>
    item.status === "completed" &&
    item.organizationId &&
    "organizationName" in item
      ? [
          {
            id: item.id,
            organizationId: item.organizationId,
            label: `${item.animalName} · ${item.organizationName}`,
          },
        ]
      : [],
  );
  const selectedApplication = completed.find(
    (item) => item.id === applicationId,
  );
  const ownAnimals = (loadedAnimals ?? []).filter(
    (item) =>
      item.source === "private_submission" &&
      !["adopted", "archived"].includes(item.status) &&
      (!item.responsibleOrganizationId ||
        !organizationId ||
        item.responsibleOrganizationId === organizationId),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (create.isPending || isUploading) return;
    setError(null);
    const base = {
      reason: reason.trim(),
      documents: documents.map((item) => item.id),
    };
    let input: SurrenderInput;
    if (kind === "return") {
      if (!selectedApplication) {
        setError("Escolha a adoção concluída que deseja devolver.");
        return;
      }
      input = {
        ...base,
        kind,
        organizationId: selectedApplication.organizationId,
        applicationId: selectedApplication.id,
      };
    } else {
      if (!organizationId) {
        setError("Escolha a ONG que receberá o animal.");
        return;
      }
      input = animalId
        ? { ...base, kind, organizationId, animalId }
        : { ...base, kind, organizationId, animal: cleanAnimal(animal) };
    }
    try {
      const created = await create.mutateAsync(input);
      router.push(`/adopter/surrenders/${encodeURIComponent(created.id)}`);
    } catch {
      // Shown through create.error.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-lg font-bold">Tipo de solicitação</legend>
        {(
          [
            {
              value: "intake",
              label: "Entregar um animal a uma ONG",
              hint: "Para um animal sob seus cuidados que a ONG passará a acolher.",
            },
            {
              value: "return",
              label: "Devolver um animal que adotei",
              hint: "Somente para adoções concluídas, devolvendo à mesma ONG.",
            },
          ] as const
        ).map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border-light p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-faint has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
          >
            <input
              type="radio"
              name="surrender-kind"
              value={option.value}
              checked={kind === option.value}
              onChange={() => setKind(option.value)}
              className="mt-1 accent-accent-tertiary"
            />
            <span>
              <span className="block font-semibold">{option.label}</span>
              <span className="block text-sm text-neutral-600">
                {option.hint}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {kind === "return" ? (
        <>
          <QueryStatus query={applications} />
          {applications.data && !completed.length ? (
            <p role="note">
              Você não tem adoções concluídas que possam ser devolvidas.
            </p>
          ) : null}
          {completed.length ? (
            <Select
              id="surrender-application"
              label="Adoção concluída"
              required
              placeholder="Escolha o animal"
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              options={completed.map((item) => ({
                value: item.id,
                label: item.label,
              }))}
              hint="A devolução é feita à ONG responsável pela adoção. Os dados atuais do animal são copiados automaticamente."
            />
          ) : null}
          {applications.hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              loading={applications.isFetchingNextPage}
              onClick={() => void applications.fetchNextPage()}
            >
              Carregar mais adoções ({completed.length} de {completedTotal})
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <QueryStatus query={organizations} />
          <Select
            id="surrender-organization"
            label="ONG que receberá o animal"
            required
            placeholder="Escolha uma ONG verificada"
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            options={(organizations.data?.items ?? []).map((item) => ({
              value: item.id,
              label: item.location?.city
                ? `${item.name} · ${item.location.city}/${item.location.state ?? ""}`
                : item.name,
            }))}
          />
          {ownAnimals.length ? (
            <Select
              id="surrender-animal"
              label="Animal já cadastrado por você (opcional)"
              value={animalId}
              onChange={(event) => setAnimalId(event.target.value)}
              options={[
                { value: "", label: "Informar os dados de outro animal" },
                ...ownAnimals.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
              hint={
                inventory.hasNextPage
                  ? `${loadedAnimals?.length ?? 0} de ${animalTotal} animais cadastrados carregados.`
                  : undefined
              }
            />
          ) : null}
          <QueryStatus query={inventory} />
          {inventory.hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              loading={inventory.isFetchingNextPage}
              onClick={() => void inventory.fetchNextPage()}
            >
              Carregar mais animais cadastrados
            </Button>
          ) : null}
          {animalId ? null : (
            <AnimalFields
              idPrefix="surrender-animal"
              value={animal}
              onChange={setAnimal}
            />
          )}
        </>
      )}

      <Textarea
        id="surrender-reason"
        label="Motivo da entrega"
        required
        minLength={20}
        maxLength={5000}
        rows={5}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        hint="Explique a situação para a ONG. Mínimo de 20 caracteres."
      />
      <EvidenceUpload
        id="surrender-documents"
        label="Documentos e fotos (opcional)"
        purpose="surrender"
        value={documents}
        onChange={setDocuments}
        onBusyChange={setIsUploading}
      />
      <FormError id="surrender-error">
        {error ?? create.error?.message}
      </FormError>
      <Button
        type="submit"
        loading={create.isPending}
        disabled={isUploading || reason.trim().length < 20}
      >
        Enviar solicitação
      </Button>
    </form>
  );
}
