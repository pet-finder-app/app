"use client";

import {
  Button,
  Card,
  CardDescription,
  CardTitle,
  Checkbox,
  FormError,
  Input,
  PhotoInput,
  Select,
  Textarea,
} from "@/components/ui";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SIZE_LABEL,
  PET_SPECIES_LABEL,
  type PetAgeGroup,
  type PetSex,
  type PetSize,
  type PetSpecies,
} from "@/lib/pet";
import {
  createEmptySurrenderForm,
  createEmptySurrenderPet,
  SURRENDER_REASON_KEYS,
  SURRENDER_REASON_LABEL,
  SURRENDER_URGENCY_KEYS,
  SURRENDER_URGENCY_LABEL,
  validateSurrenderRequest,
  type SurrenderFormInput,
  type SurrenderPet,
  type SurrenderReason,
  type SurrenderUrgency,
} from "@/lib/surrender";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ERROR_ID = "surrender-error";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/** Shared surrender-request fields for pet information, reason, and ownership declaration. Also used when revising a request. */
export function SurrenderFields({
  pet,
  form,
  onPetChange,
  onFormChange,
  lockPet = false,
}: {
  pet: SurrenderPet;
  form: SurrenderFormInput;
  onPetChange: (pet: SurrenderPet) => void;
  onFormChange: (form: SurrenderFormInput) => void;
  /** Known pet return: preserve its name and species. */
  lockPet?: boolean;
}) {
  const setPet = <K extends keyof SurrenderPet>(
    key: K,
    value: SurrenderPet[K],
  ) => onPetChange({ ...pet, [key]: value });
  const setForm = <K extends keyof SurrenderFormInput>(
    key: K,
    value: SurrenderFormInput[K],
  ) => onFormChange({ ...form, [key]: value });

  return (
    <>
      <Card className="gap-3">
        <CardTitle>Sobre o pet</CardTitle>
        <Input
          id="surrenderName"
          label="Nome do pet"
          value={pet.name}
          disabled={lockPet}
          onChange={(e) => setPet("name", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            id="surrenderSpecies"
            label="Espécie"
            value={pet.species}
            disabled={lockPet}
            options={toOptions(PET_SPECIES_LABEL)}
            onChange={(e) => setPet("species", e.target.value as PetSpecies)}
          />
          <Select
            id="surrenderSex"
            label="Sexo"
            value={pet.sex}
            options={toOptions(PET_SEX_LABEL)}
            onChange={(e) => setPet("sex", e.target.value as PetSex)}
          />
          <Select
            id="surrenderSize"
            label="Porte"
            value={pet.size}
            options={toOptions(PET_SIZE_LABEL)}
            onChange={(e) => setPet("size", e.target.value as PetSize)}
          />
          <Select
            id="surrenderAge"
            label="Idade"
            value={pet.ageGroup}
            options={toOptions(PET_AGE_GROUP_LABEL)}
            onChange={(e) => setPet("ageGroup", e.target.value as PetAgeGroup)}
          />
        </div>
        <Input
          id="surrenderBreed"
          label="Raça (opcional)"
          hint="Vira-lata também vale."
          value={pet.breed}
          onChange={(e) => setPet("breed", e.target.value)}
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold text-neutral-900">
            Saúde
          </legend>
          <Checkbox
            id="surrenderVaccinated"
            label="Vacinado"
            checked={pet.health.vaccinated}
            onChange={(e) =>
              setPet("health", { ...pet.health, vaccinated: e.target.checked })
            }
          />
          <Checkbox
            id="surrenderNeutered"
            label="Castrado"
            checked={pet.health.neutered}
            onChange={(e) =>
              setPet("health", { ...pet.health, neutered: e.target.checked })
            }
          />
          <Checkbox
            id="surrenderDewormed"
            label="Vermifugado"
            checked={pet.health.dewormed}
            onChange={(e) =>
              setPet("health", { ...pet.health, dewormed: e.target.checked })
            }
          />
        </fieldset>
        <Input
          id="surrenderSpecialNeeds"
          label="Cuidados especiais (opcional)"
          hint="Remédios, doenças, alimentação especial."
          value={pet.health.specialNeeds}
          onChange={(e) =>
            setPet("health", { ...pet.health, specialNeeds: e.target.value })
          }
        />
        <Textarea
          id="surrenderDescription"
          label="Como ele é?"
          hint="Jeito, rotina, o que gosta e a história dele. A ONG usa isto para procurar um novo lar."
          value={pet.description}
          onChange={(e) => setPet("description", e.target.value)}
        />
        <PhotoInput
          id="surrenderPhotos"
          label="Fotos"
          hint="Pelo menos uma, de preferência de corpo inteiro."
          value={pet.photos}
          onChange={(photos) => setPet("photos", photos)}
        />
      </Card>

      <Card className="gap-3">
        <CardTitle>Por que você precisa deixar o pet?</CardTitle>
        <Select
          id="surrenderReason"
          label="Motivo principal"
          value={form.reason}
          options={SURRENDER_REASON_KEYS.map((value) => ({
            value,
            label: SURRENDER_REASON_LABEL[value],
          }))}
          onChange={(e) => setForm("reason", e.target.value as SurrenderReason)}
        />
        <Textarea
          id="surrenderReasonDetails"
          label="Conte o que aconteceu"
          hint="A ONG lê com respeito. Quanto mais ela souber, melhor consegue ajudar."
          value={form.reasonDetails}
          onChange={(e) => setForm("reasonDetails", e.target.value)}
        />
        <Textarea
          id="surrenderBehavior"
          label="Convivência (opcional)"
          hint="Como ele se dá com crianças e outros animais? Já mordeu ou foi agressivo alguma vez?"
          value={form.behavior}
          onChange={(e) => setForm("behavior", e.target.value)}
        />
        <Select
          id="surrenderUrgency"
          label="Urgência"
          value={form.urgency}
          options={SURRENDER_URGENCY_KEYS.map((value) => ({
            value,
            label: SURRENDER_URGENCY_LABEL[value],
          }))}
          onChange={(e) =>
            setForm("urgency", e.target.value as SurrenderUrgency)
          }
        />
        <Checkbox
          id="surrenderOwnership"
          label="Declaro que sou o responsável por este animal e que as informações são verdadeiras"
          checked={form.declaresOwnership}
          onChange={(e) => setForm("declaresOwnership", e.target.checked)}
        />
      </Card>
    </>
  );
}

export type SurrenderNgoOption = { id: string; name: string; city: string };

/** A previously adopted Petfinder pet that may be returned to the same NGO. */
export type SurrenderReturnOption = {
  adoptionId: string;
  ngoId: string;
  ngoName: string;
  pet: SurrenderPet;
};

/** Select an NGO or an adopted pet to return, explain the circumstances, and submit a surrender request. Review and signing happen in the process view. */
export function SurrenderRequestForm({
  ngos,
  returns,
  initialNgoId,
  initialAdoptionId,
}: {
  ngos: SurrenderNgoOption[];
  returns: SurrenderReturnOption[];
  initialNgoId?: string;
  initialAdoptionId?: string;
}) {
  const router = useRouter();
  const initialReturn = returns.find((r) => r.adoptionId === initialAdoptionId);
  const [adoptionId, setAdoptionId] = useState(initialReturn?.adoptionId ?? "");
  const [ngoId, setNgoId] = useState(
    initialReturn?.ngoId ??
      (ngos.some((o) => o.id === initialNgoId) ? (initialNgoId ?? "") : ""),
  );
  const [pet, setPet] = useState<SurrenderPet>(
    initialReturn?.pet ?? createEmptySurrenderPet(),
  );
  const [form, setForm] = useState<SurrenderFormInput>(
    createEmptySurrenderForm(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returning = returns.find((r) => r.adoptionId === adoptionId);

  function chooseReturn(value: string) {
    setAdoptionId(value);
    const chosen = returns.find((r) => r.adoptionId === value);
    if (chosen) {
      setNgoId(chosen.ngoId);
      setPet(chosen.pet);
    } else {
      setPet(createEmptySurrenderPet());
    }
  }

  async function submit() {
    setError(null);
    if (!ngoId) {
      setError("Escolha a ONG que vai receber o pet.");
      return;
    }
    const problem = validateSurrenderRequest(pet, form);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/surrenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ngoId,
          adoptionId: adoptionId || null,
          pet,
          form,
        }),
      });
      const data = (await response.json()) as {
        surrender?: { id: string };
        message?: string;
      };
      if (!response.ok || !data.surrender) {
        setError(data.message ?? "Não foi possível enviar o pedido.");
        return;
      }
      router.push(`/adopter/surrenders/${data.surrender.id}`);
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-3">
        <CardTitle>Para qual ONG?</CardTitle>
        {returns.length > 0 ? (
          <Select
            id="surrenderReturn"
            label="De onde veio o pet?"
            value={adoptionId}
            options={[
              { value: "", label: "Já era meu, não foi adotado pelo app" },
              ...returns.map((r) => ({
                value: r.adoptionId,
                label: `Adotei ${r.pet.name} pelo app (${r.ngoName})`,
              })),
            ]}
            onChange={(e) => chooseReturn(e.target.value)}
          />
        ) : null}
        <Select
          id="surrenderNgo"
          label="ONG que vai receber o pet"
          value={ngoId}
          placeholder="Escolha uma ONG"
          disabled={Boolean(returning)}
          options={ngos.map((o) => ({
            value: o.id,
            label: o.city ? `${o.name} (${o.city})` : o.name,
          }))}
          onChange={(e) => setNgoId(e.target.value)}
        />
        <CardDescription>
          {returning
            ? "Como foi ela que entregou o pet para você, a devolução é feita a ela."
            : "Só aparecem ONGs verificadas. A ONG decide se tem espaço para receber o animal."}
        </CardDescription>
      </Card>

      <SurrenderFields
        pet={pet}
        form={form}
        onPetChange={setPet}
        onFormChange={setForm}
        lockPet={Boolean(returning)}
      />

      <FormError id={ERROR_ID} collapsible>
        {error}
      </FormError>
      <Button
        loading={busy}
        loadingLabel="ENVIANDO..."
        onClick={() => void submit()}
      >
        ENVIAR PEDIDO PARA A ONG
      </Button>
    </div>
  );
}
