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

/** Erros que pertencem a um campo (aparecem embaixo dele, não no fim da página). */
const FIELD_ERROR = {
  name: "Dê um nome para o pet.",
  sex: "Escolha o sexo do pet.",
  ageGroup: "Escolha a idade do pet.",
  description: "Escreva uma descrição do pet.",
  photos: "Adicione ao menos uma foto.",
} as const;

const DUPLICATE_PREFIX = "Você já tem um pet chamado";

const FIELD_BY_ERROR: [string, string][] = [
  ["nome", "name"],
  ["você já tem", "name"],
  ["foto", "photos"],
  ["sexo", "sex"],
  ["idade", "ageGroup"],
  ["descrição", "description"],
];

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
  // No cadastro, sexo e idade começam em branco: um valor pré-marcado seria
  // salvo errado sem a pessoa perceber.
  const [sexChosen, setSexChosen] = useState(props.mode === "edit");
  const [ageChosen, setAgeChosen] = useState(props.mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function patch(changes: Partial<PetInput>) {
    setInput((prev) => ({ ...prev, ...changes }));
  }

  /** Mensagem de erro logo abaixo do campo a que ela se refere. */
  function inlineError(field: keyof typeof FIELD_ERROR) {
    return error === FIELD_ERROR[field] ||
      (field === "name" && error?.startsWith(DUPLICATE_PREFIX)) ? (
      <FormError id={`${field}-error`}>{error}</FormError>
    ) : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Mesma ordem em que os campos aparecem na tela.
    const validationError = !input.name.trim()
      ? "Dê um nome para o pet."
      : !sexChosen
        ? "Escolha o sexo do pet."
        : !ageChosen
          ? "Escolha a idade do pet."
          : !input.description.trim()
            ? "Escreva uma descrição do pet."
            : validatePetInput(input);
    if (validationError) {
      setError(validationError);
      // O botão fica no fim da página: leva a pessoa até o campo com problema.
      const field = FIELD_BY_ERROR.find(([text]) =>
        validationError.toLowerCase().includes(text),
      )?.[1];
      requestAnimationFrame(() =>
        globalThis.document
          .getElementById(field ?? "name")
          ?.scrollIntoView({ block: "center", behavior: "smooth" }),
      );
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
        if (response.status === 409) {
          // Nome repetido: leva a pessoa até o campo Nome.
          requestAnimationFrame(() => {
            const field = globalThis.document.getElementById("name");
            field?.scrollIntoView({ block: "center", behavior: "smooth" });
            field?.focus({ preventScroll: true });
          });
        }
        return;
      }

      router.push(props.mode === "edit" ? "/" : "/?criado=pet");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
            label="Nome (obrigatório)"
            required
            tone="brutal"
            value={input.name}
            onChange={(e) => patch({ name: e.target.value })}
            invalid={
              error === "Dê um nome para o pet." ||
              error?.startsWith(DUPLICATE_PREFIX)
            }
            errorId="name-error"
          />
          {inlineError("name")}

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="species"
              label="Espécie (obrigatório)"
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
              label="Raça (opcional)"
              placeholder="SRD (vira-lata)"
              tone="brutal"
              value={input.breed}
              onChange={(e) => patch({ breed: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="sex"
              label="Sexo (obrigatório)"
              tone="brutal"
              value={sexChosen ? input.sex : ""}
              placeholder="Escolha"
              invalid={error === "Escolha o sexo do pet."}
              errorId="sex-error"
              onChange={(e) => {
                setSexChosen(true);
                patch({ sex: e.target.value as PetSex });
              }}
              options={(Object.keys(PET_SEX_LABEL) as PetSex[]).map((key) => ({
                value: key,
                label: PET_SEX_LABEL[key],
              }))}
            />
            <Select
              id="size"
              label="Porte (obrigatório)"
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
          {inlineError("sex")}

          <Input
            id="sizeCm"
            label="Tamanho aproximado em cm (opcional)"
            tone="brutal"
            type="number"
            inputMode="numeric"
            min={1}
            max={300}
            value={input.sizeCm ?? ""}
            onChange={(e) =>
              patch({
                sizeCm: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />

          <Select
            id="ageGroup"
            label="Idade (obrigatório)"
            tone="brutal"
            value={ageChosen ? input.ageGroup : ""}
            placeholder="Escolha"
            hint="Para dizer a idade exata (ex.: 2 anos, 6 meses), conte na descrição."
            invalid={error === "Escolha a idade do pet."}
            errorId="ageGroup-error"
            onChange={(e) => {
              setAgeChosen(true);
              patch({ ageGroup: e.target.value as PetAgeGroup });
            }}
            options={(Object.keys(PET_AGE_GROUP_LABEL) as PetAgeGroup[]).map(
              (key) => ({
                value: key,
                label: PET_AGE_GROUP_LABEL[key],
              }),
            )}
          />
          {inlineError("ageGroup")}

          <ListField
            id="temperament"
            label="Temperamento (opcional)"
            hint="Dócil, brincalhão, independente... separe com vírgula."
            value={input.temperament}
            onChange={(list) => patch({ temperament: list })}
          />

          <Textarea
            id="description"
            label="Descrição (obrigatório)"
            required
            tone="brutal"
            placeholder="História, personalidade, o que ele mais gosta..."
            value={input.description}
            onChange={(e) => patch({ description: e.target.value })}
            invalid={error === "Escreva uma descrição do pet."}
            errorId="description-error"
          />
          {inlineError("description")}

          <PhotoInput
            id="photos"
            label="Fotos (obrigatório)"
            tone="brutal"
            hint="Pelo menos uma foto, de frente e com boa luz."
            value={input.photos}
            onChange={(photos) => {
              patch({ photos });
              setError(null);
            }}
            invalid={error === "Adicione ao menos uma foto."}
            errorId="photos-error"
          />
          {inlineError("photos")}
        </BrutalCard>

        <BrutalCard className="gap-3">
          <CardTitle>Saúde (opcional)</CardTitle>
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
            label="Necessidades especiais (opcional)"
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

        <FormError id={ERROR_ID}>
          {Object.values(FIELD_ERROR).includes(error as never) ||
          error?.startsWith(DUPLICATE_PREFIX)
            ? null
            : error}
        </FormError>

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
