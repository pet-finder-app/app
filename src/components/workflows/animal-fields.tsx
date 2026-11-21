"use client";
import { Input, Select, Textarea } from "@/components/ui";
import type { SurrenderAnimalInput } from "@/lib/api/workflows";
import type { AnimalRequest } from "@/lib/backend/contracts";
import { z } from "zod";
import { options, SEX_LABELS, SIZE_LABELS, SPECIES_LABELS } from "./labels";

const speciesSchema = z.enum([
  "dog",
  "cat",
  "bird",
  "rabbit",
  "reptile",
  "small_mammal",
  "other",
]);
const sexSchema = z.enum(["female", "male", "unknown"]);
const sizeSchema = z.enum(["small", "medium", "large", "extra_large"]);

export const EMPTY_ANIMAL: SurrenderAnimalInput = {
  name: "",
  species: "dog",
  sex: "unknown",
  size: "medium",
  description: "",
  breed: "",
  approximateBirthDate: "",
  healthNotes: "",
  behaviorNotes: "",
  location: { city: "", state: "", countryCode: "BR" },
};

/** Editable copy of a snapshot Go stored; extra attributes are preserved. */
export function animalFromSnapshot(
  snapshot: AnimalRequest,
): SurrenderAnimalInput {
  const attributes = snapshot.attributes
    ? Object.fromEntries(
        Object.entries(snapshot.attributes).filter(
          ([, value]) => value !== undefined,
        ),
      )
    : undefined;
  return {
    name: snapshot.name,
    species: snapshot.species,
    sex: snapshot.sex,
    size: snapshot.size,
    description: snapshot.description,
    breed: snapshot.breed ?? "",
    approximateBirthDate: snapshot.approximateBirthDate ?? "",
    healthNotes: snapshot.healthNotes ?? "",
    behaviorNotes: snapshot.behaviorNotes ?? "",
    attributes,
    location: {
      city: snapshot.location.city,
      state: snapshot.location.state,
      countryCode: snapshot.location.countryCode,
    },
  };
}

/** Drop empty optional text so Go's length and date checks only see values. */
export function cleanAnimal(
  animal: SurrenderAnimalInput,
): SurrenderAnimalInput {
  const optional = (value: string | undefined) => value?.trim() || undefined;
  return {
    ...animal,
    name: animal.name.trim(),
    description: animal.description.trim(),
    breed: optional(animal.breed),
    approximateBirthDate: optional(animal.approximateBirthDate),
    healthNotes: optional(animal.healthNotes),
    behaviorNotes: optional(animal.behaviorNotes),
    location: {
      city: animal.location.city.trim(),
      state: animal.location.state.trim().toUpperCase(),
      countryCode: animal.location.countryCode.trim().toUpperCase(),
    },
  };
}

type AnimalFieldsProps = {
  idPrefix: string;
  value: SurrenderAnimalInput;
  onChange: (value: SurrenderAnimalInput) => void;
};

/** Animal snapshot fields of a surrender request, with Go's limits. */
export function AnimalFields({ idPrefix, value, onChange }: AnimalFieldsProps) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-lg font-bold">Dados do animal</legend>
      <Input
        id={`${idPrefix}-name`}
        label="Nome"
        required
        maxLength={100}
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
      />
      <Select
        id={`${idPrefix}-species`}
        label="Espécie"
        value={value.species}
        onChange={(event) =>
          onChange({
            ...value,
            species: speciesSchema.parse(event.target.value),
          })
        }
        options={options(SPECIES_LABELS)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          id={`${idPrefix}-sex`}
          label="Sexo"
          value={value.sex}
          onChange={(event) =>
            onChange({ ...value, sex: sexSchema.parse(event.target.value) })
          }
          options={options(SEX_LABELS)}
        />
        <Select
          id={`${idPrefix}-size`}
          label="Porte"
          value={value.size}
          onChange={(event) =>
            onChange({ ...value, size: sizeSchema.parse(event.target.value) })
          }
          options={options(SIZE_LABELS)}
        />
      </div>
      <Input
        id={`${idPrefix}-breed`}
        label="Raça (opcional)"
        maxLength={100}
        value={value.breed ?? ""}
        onChange={(event) => onChange({ ...value, breed: event.target.value })}
      />
      <Input
        id={`${idPrefix}-birth`}
        type="date"
        label="Data aproximada de nascimento (opcional)"
        max={today}
        value={value.approximateBirthDate ?? ""}
        onChange={(event) =>
          onChange({ ...value, approximateBirthDate: event.target.value })
        }
      />
      <Textarea
        id={`${idPrefix}-description`}
        label="Descrição"
        required
        minLength={20}
        maxLength={5000}
        value={value.description}
        onChange={(event) =>
          onChange({ ...value, description: event.target.value })
        }
        hint="Mínimo de 20 caracteres."
      />
      <Textarea
        id={`${idPrefix}-health`}
        label="Saúde (opcional)"
        maxLength={3000}
        value={value.healthNotes ?? ""}
        onChange={(event) =>
          onChange({ ...value, healthNotes: event.target.value })
        }
      />
      <Textarea
        id={`${idPrefix}-behavior`}
        label="Comportamento (opcional)"
        maxLength={3000}
        value={value.behaviorNotes ?? ""}
        onChange={(event) =>
          onChange({ ...value, behaviorNotes: event.target.value })
        }
      />
      <div className="grid grid-cols-[1fr_5rem_5rem] gap-3">
        <Input
          id={`${idPrefix}-city`}
          label="Cidade"
          required
          maxLength={100}
          value={value.location.city}
          onChange={(event) =>
            onChange({
              ...value,
              location: { ...value.location, city: event.target.value },
            })
          }
        />
        <Input
          id={`${idPrefix}-state`}
          label="UF"
          required
          maxLength={8}
          value={value.location.state}
          onChange={(event) =>
            onChange({
              ...value,
              location: { ...value.location, state: event.target.value },
            })
          }
        />
        <Input
          id={`${idPrefix}-country`}
          label="País"
          required
          pattern="[A-Za-z]{2}"
          maxLength={2}
          value={value.location.countryCode}
          onChange={(event) =>
            onChange({
              ...value,
              location: { ...value.location, countryCode: event.target.value },
            })
          }
        />
      </div>
    </fieldset>
  );
}

/** Read-only summary of an animal snapshot. */
export function AnimalSummary({ animal }: { animal: AnimalRequest }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      <dt className="font-semibold">Nome</dt>
      <dd>{animal.name}</dd>
      <dt className="font-semibold">Espécie</dt>
      <dd>{SPECIES_LABELS[animal.species] ?? animal.species}</dd>
      <dt className="font-semibold">Sexo</dt>
      <dd>{SEX_LABELS[animal.sex] ?? animal.sex}</dd>
      <dt className="font-semibold">Porte</dt>
      <dd>{SIZE_LABELS[animal.size] ?? animal.size}</dd>
      {animal.breed ? (
        <>
          <dt className="font-semibold">Raça</dt>
          <dd>{animal.breed}</dd>
        </>
      ) : null}
      {animal.approximateBirthDate ? (
        <>
          <dt className="font-semibold">Nascimento</dt>
          <dd>
            {new Date(
              `${animal.approximateBirthDate}T12:00:00`,
            ).toLocaleDateString("pt-BR")}
          </dd>
        </>
      ) : null}
      <dt className="font-semibold">Local</dt>
      <dd>
        {animal.location.city}/{animal.location.state}
      </dd>
      <dt className="font-semibold">Descrição</dt>
      <dd className="whitespace-pre-wrap">{animal.description}</dd>
      {animal.healthNotes ? (
        <>
          <dt className="font-semibold">Saúde</dt>
          <dd className="whitespace-pre-wrap">{animal.healthNotes}</dd>
        </>
      ) : null}
      {animal.behaviorNotes ? (
        <>
          <dt className="font-semibold">Comportamento</dt>
          <dd className="whitespace-pre-wrap">{animal.behaviorNotes}</dd>
        </>
      ) : null}
    </dl>
  );
}
