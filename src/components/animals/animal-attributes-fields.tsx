"use client";
import { Checkbox, Input, Select } from "@/components/ui";
import {
  energyLevelSchema,
  type AnimalAttributesInput,
} from "@/lib/api/animals";
import type { AnimalAttributes } from "@/lib/backend/contracts";
import { z } from "zod";
import { ENERGY_LABELS } from "./animal-labels";

const triStateSchema = z.enum(["", "yes", "no"]);
type TriState = z.output<typeof triStateSchema>;
const energyChoiceSchema = z.union([z.literal(""), energyLevelSchema]);

/** Form-friendly attribute values; numbers and lists stay text while editing. */
export type AttributesDraft = {
  heightCm: string;
  weightKg: string;
  temperament: string;
  medicalConditions: string;
  vaccinated: TriState;
  neutered: TriState;
  specialNeeds: boolean;
  energyLevel: z.output<typeof energyChoiceSchema>;
};

const fromBoolean = (value: boolean | null | undefined): TriState =>
  value === true ? "yes" : value === false ? "no" : "";
const toBoolean = (value: TriState) =>
  value === "yes" ? true : value === "no" ? false : undefined;
const toNumber = (value: string) => {
  const parsed = Number(value.replace(",", "."));
  return value.trim() && Number.isFinite(parsed) && parsed > 0
    ? parsed
    : undefined;
};
const toList = (value: string) =>
  value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);

export function attributesDraftFrom(
  attributes: AnimalAttributes | null,
  fallback?: {
    vaccinated: boolean | null;
    neutered: boolean | null;
    specialNeeds: boolean;
  },
): AttributesDraft {
  return {
    heightCm: attributes?.heightCm?.toString() ?? "",
    weightKg: attributes?.weightKg?.toString() ?? "",
    temperament: attributes?.temperament?.join(", ") ?? "",
    medicalConditions: attributes?.medicalConditions?.join(", ") ?? "",
    vaccinated: fromBoolean(attributes?.vaccinated ?? fallback?.vaccinated),
    neutered: fromBoolean(attributes?.neutered ?? fallback?.neutered),
    specialNeeds: attributes?.specialNeeds ?? fallback?.specialNeeds ?? false,
    energyLevel: attributes?.energyLevel ?? "",
  };
}

export function attributesInputFrom(
  draft: AttributesDraft,
): AnimalAttributesInput {
  const temperament = toList(draft.temperament);
  const medicalConditions = toList(draft.medicalConditions);
  return {
    heightCm: toNumber(draft.heightCm),
    weightKg: toNumber(draft.weightKg),
    temperament: temperament.length ? temperament : undefined,
    medicalConditions: medicalConditions.length ? medicalConditions : undefined,
    vaccinated: toBoolean(draft.vaccinated),
    neutered: toBoolean(draft.neutered),
    specialNeeds: draft.specialNeeds || undefined,
    energyLevel: draft.energyLevel || undefined,
  };
}

const TRI_STATE_OPTIONS = [
  { value: "", label: "Não informado" },
  { value: "yes", label: "Sim" },
  { value: "no", label: "Não" },
];

type AnimalAttributesFieldsProps = {
  value: AttributesDraft;
  onChange: (value: AttributesDraft) => void;
};

export function AnimalAttributesFields({
  value,
  onChange,
}: AnimalAttributesFieldsProps) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-lg font-bold">
        Características e saúde
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="animal-height"
          label="Altura (cm)"
          type="number"
          inputMode="decimal"
          min={0.1}
          max={1000}
          step="any"
          value={value.heightCm}
          onChange={(event) =>
            onChange({ ...value, heightCm: event.target.value })
          }
        />
        <Input
          id="animal-weight"
          label="Peso (kg)"
          type="number"
          inputMode="decimal"
          min={0.1}
          max={1000}
          step="any"
          value={value.weightKg}
          onChange={(event) =>
            onChange({ ...value, weightKg: event.target.value })
          }
        />
      </div>
      <Select
        id="animal-energy"
        label="Nível de energia"
        value={value.energyLevel}
        options={[
          { value: "", label: "Não informado" },
          ...energyLevelSchema.options.map((level) => ({
            value: level,
            label: ENERGY_LABELS[level],
          })),
        ]}
        onChange={(event) =>
          onChange({
            ...value,
            energyLevel: energyChoiceSchema.parse(event.target.value),
          })
        }
      />
      <Input
        id="animal-temperament"
        label="Temperamento (opcional)"
        hint="Separe por vírgulas, por exemplo: dócil, brincalhão. Até 30 itens."
        value={value.temperament}
        onChange={(event) =>
          onChange({ ...value, temperament: event.target.value })
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          id="animal-vaccinated"
          label="Vacinado"
          value={value.vaccinated}
          options={TRI_STATE_OPTIONS}
          onChange={(event) =>
            onChange({
              ...value,
              vaccinated: triStateSchema.parse(event.target.value),
            })
          }
        />
        <Select
          id="animal-neutered"
          label="Castrado"
          value={value.neutered}
          options={TRI_STATE_OPTIONS}
          onChange={(event) =>
            onChange({
              ...value,
              neutered: triStateSchema.parse(event.target.value),
            })
          }
        />
      </div>
      <Checkbox
        id="animal-special-needs"
        label="Tem necessidades especiais"
        checked={value.specialNeeds}
        onChange={(event) =>
          onChange({ ...value, specialNeeds: event.target.checked })
        }
      />
      <Input
        id="animal-medical-conditions"
        label="Condições médicas (opcional)"
        hint="Separe por vírgulas. Até 30 itens."
        value={value.medicalConditions}
        onChange={(event) =>
          onChange({ ...value, medicalConditions: event.target.value })
        }
      />
    </fieldset>
  );
}
