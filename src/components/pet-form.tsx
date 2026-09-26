"use client";

import { BrutalButton, BrutalLinkButton } from "@/components/brutal-button";
import { BrutalCard } from "@/components/brutal-card";
import {
  CardDescription,
  CardTitle,
  Checkbox,
  FormError,
  iconSize,
  Input,
  PageShell,
  PhotoInput,
  Select,
  Textarea,
} from "@/components/ui";
import {
  createEmptyPetInput,
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SIZE_LABEL,
  PET_SPECIES_KEYS,
  PET_SPECIES_LABEL,
  PET_STATUS_LABEL,
  validatePetInput,
  type PetAgeGroup,
  type PetInput,
  type PetSex,
  type PetSize,
  type PetSpecies,
  type PetStatus,
} from "@/lib/pet";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERROR_ID = "pet-form-error";

const STATUS_OPTIONS = (Object.keys(PET_STATUS_LABEL) as PetStatus[]).map(
  (key) => ({ value: key, label: PET_STATUS_LABEL[key] }),
);

type PetFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      petId: string;
      initialInput: PetInput;
      initialStatus: PetStatus;
    };

/**
 * Formulário de pet, compartilhado entre cadastrar (`/ong/pets/novo`) e
 * editar (`/ong/pets/[id]/editar`). Só o modo edição mostra o status da
 * adoção — no cadastro ele sempre começa como "disponível".
 */
export function PetForm(props: PetFormProps) {
  const router = useRouter();
  const [input, setInput] = useState<PetInput>(
    props.mode === "edit" ? props.initialInput : createEmptyPetInput(),
  );
  const [status, setStatus] = useState<PetStatus>(
    props.mode === "edit" ? props.initialStatus : "disponivel",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function patch(changes: Partial<PetInput>) {
    setInput((prev) => ({ ...prev, ...changes }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validatePetInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const url =
        props.mode === "edit"
          ? `/api/ong/pets/${props.petId}`
          : "/api/ong/pets";
      const body =
        props.mode === "edit"
          ? JSON.stringify({ pet: { ...input, status } })
          : JSON.stringify({ pet: input });

      const response = await fetch(url, {
        method: props.mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ??
            (props.mode === "edit"
              ? "Não foi possível salvar as alterações."
              : "Não foi possível cadastrar o pet."),
        );
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <BrutalCard as="header" className="gap-2">
          <BrutalLinkButton
            href="/"
            variant="pill"
            size="sm"
            className="self-start"
          >
            <ChevronLeft className={iconSize.sm} aria-hidden="true" />
            Início
          </BrutalLinkButton>
          <CardTitle>
            {props.mode === "edit" ? "Editar pet" : "Cadastrar pet"}
          </CardTitle>
          <CardDescription>
            {props.mode === "edit"
              ? "Atualize os dados ou o status da adoção."
              : "Conte como é o bichinho para ajudar a encontrar o lar certo."}
          </CardDescription>
        </BrutalCard>

        {props.mode === "edit" ? (
          <BrutalCard className="gap-3">
            <Select
              id="status"
              label="Status da adoção"
              tone="brutal"
              value={status}
              onChange={(e) => setStatus(e.target.value as PetStatus)}
              options={STATUS_OPTIONS}
            />
          </BrutalCard>
        ) : null}

        <BrutalCard className="gap-3">
          <Input
            id="name"
            label="Nome"
            required
            tone="brutal"
            value={input.name}
            onChange={(e) => patch({ name: e.target.value })}
            invalid={error === "Dê um nome para o pet."}
            errorId={ERROR_ID}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="species"
              label="Espécie"
              tone="brutal"
              value={input.species}
              onChange={(e) => patch({ species: e.target.value as PetSpecies })}
              options={PET_SPECIES_KEYS.map((key) => ({
                value: key,
                label: PET_SPECIES_LABEL[key],
              }))}
            />
            <Input
              id="breed"
              label="Raça"
              placeholder="SRD (vira-lata)"
              tone="brutal"
              value={input.breed}
              onChange={(e) => patch({ breed: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="sex"
              label="Sexo"
              tone="brutal"
              value={input.sex}
              onChange={(e) => patch({ sex: e.target.value as PetSex })}
              options={(Object.keys(PET_SEX_LABEL) as PetSex[]).map((key) => ({
                value: key,
                label: PET_SEX_LABEL[key],
              }))}
            />
            <Select
              id="size"
              label="Porte"
              tone="brutal"
              value={input.size}
              onChange={(e) => patch({ size: e.target.value as PetSize })}
              options={(Object.keys(PET_SIZE_LABEL) as PetSize[]).map(
                (key) => ({
                  value: key,
                  label: PET_SIZE_LABEL[key],
                }),
              )}
            />
          </div>
          <Select
            id="ageGroup"
            label="Idade"
            tone="brutal"
            value={input.ageGroup}
            onChange={(e) => patch({ ageGroup: e.target.value as PetAgeGroup })}
            options={(Object.keys(PET_AGE_GROUP_LABEL) as PetAgeGroup[]).map(
              (key) => ({
                value: key,
                label: PET_AGE_GROUP_LABEL[key],
              }),
            )}
          />

          <ListField
            id="temperament"
            label="Temperamento"
            hint="Dócil, brincalhão, independente... separados por vírgula."
            value={input.temperament}
            onChange={(list) => patch({ temperament: list })}
          />

          <Textarea
            id="description"
            label="Descrição"
            required
            tone="brutal"
            placeholder="História, personalidade, o que ele mais gosta..."
            value={input.description}
            onChange={(e) => patch({ description: e.target.value })}
            invalid={error === "Escreva uma descrição do pet."}
            errorId={ERROR_ID}
          />

          <PhotoInput
            id="photos"
            label="Fotos"
            tone="brutal"
            hint="Pelo menos uma foto, de frente e com boa luz."
            value={input.photos}
            onChange={(photos) => patch({ photos })}
            invalid={error === "Adicione ao menos uma foto."}
            errorId={ERROR_ID}
          />
        </BrutalCard>

        <BrutalCard className="gap-3">
          <CardTitle>Saúde</CardTitle>
          <div className="flex flex-col gap-2">
            <Checkbox
              id="vaccinated"
              label="Vacinado"
              tone="brutal"
              checked={input.health.vaccinated}
              onChange={(e) =>
                patch({
                  health: { ...input.health, vaccinated: e.target.checked },
                })
              }
            />
            <Checkbox
              id="neutered"
              label="Castrado"
              tone="brutal"
              checked={input.health.neutered}
              onChange={(e) =>
                patch({
                  health: { ...input.health, neutered: e.target.checked },
                })
              }
            />
            <Checkbox
              id="dewormed"
              label="Vermifugado"
              tone="brutal"
              checked={input.health.dewormed}
              onChange={(e) =>
                patch({
                  health: { ...input.health, dewormed: e.target.checked },
                })
              }
            />
          </div>
          <Input
            id="specialNeeds"
            label="Necessidades especiais"
            tone="brutal"
            hint="Se houver algum cuidado contínuo. Deixe em branco se não."
            value={input.health.specialNeeds}
            onChange={(e) =>
              patch({
                health: { ...input.health, specialNeeds: e.target.value },
              })
            }
          />
        </BrutalCard>

        <FormError id={ERROR_ID}>{error}</FormError>

        <BrutalButton
          type="submit"
          size="lg"
          loading={isSubmitting}
          loadingLabel={
            props.mode === "edit" ? "SALVANDO..." : "CADASTRANDO..."
          }
        >
          {props.mode === "edit" ? "SALVAR ALTERAÇÕES" : "CADASTRAR PET"}
        </BrutalButton>
      </form>
    </PageShell>
  );
}

/** Lista de textos editada como "a, b, c". Só propaga ao sair do campo. */
function ListField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string[];
  onChange: (list: string[]) => void;
}) {
  const [text, setText] = useState(value.join(", "));

  return (
    <Input
      id={id}
      label={label}
      hint={hint}
      tone="brutal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() =>
        onChange(
          text
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        )
      }
    />
  );
}
