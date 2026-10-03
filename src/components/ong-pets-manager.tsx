"use client";

import { BrutalButton } from "@/components/brutal-button";
import { BrutalCard } from "@/components/brutal-card";
import { PetListItem } from "@/components/pet-list-item";
import { iconSize } from "@/components/ui";
import {
  PET_SPECIES_KEYS,
  PET_SPECIES_LABEL,
  PET_STATUS_LABEL,
  type Pet,
  type PetSpecies,
  type PetStatus,
} from "@/lib/pet";
import { Search } from "lucide-react";
import { useState } from "react";

const CARD_TONE = ["bg-primary-faint", "bg-accent-yellow", "bg-accent-peach"];
const STATUS_KEYS = Object.keys(PET_STATUS_LABEL) as PetStatus[];

/** Remove acentos e caixa para a busca ignorar "Fêmea" × "femea". */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Lista de gestão dos pets com busca por nome/raça e filtros de status e espécie. */
export function OngPetsManager({
  pets,
  likesByPet,
  interestedByPet,
}: {
  pets: Pet[];
  likesByPet: Record<string, number>;
  interestedByPet: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PetStatus | null>(null);
  const [species, setSpecies] = useState<PetSpecies | null>(null);

  const term = normalize(query.trim());
  const filtered = pets.filter(
    (pet) =>
      (!status || pet.status === status) &&
      (!species || pet.species === species) &&
      (!term || normalize(`${pet.name} ${pet.breed ?? ""}`).includes(term)),
  );
  const hasFilters = Boolean(term || status || species);

  return (
    <>
      <BrutalCard className="gap-3">
        <div className="relative">
          <Search
            className={`${iconSize.md} pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-600`}
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Buscar pet por nome ou raça"
            placeholder="Buscar por nome ou raça"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-neutral-900 bg-white pr-3 pl-10 text-sm text-neutral-900 placeholder:text-neutral-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>

        <FilterGroup label="Status">
          {STATUS_KEYS.map((key) => (
            <Chip
              key={key}
              active={status === key}
              onClick={() => setStatus(status === key ? null : key)}
            >
              {PET_STATUS_LABEL[key]}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Espécie">
          {PET_SPECIES_KEYS.map((key) => (
            <Chip
              key={key}
              active={species === key}
              onClick={() => setSpecies(species === key ? null : key)}
            >
              {PET_SPECIES_LABEL[key]}
            </Chip>
          ))}
        </FilterGroup>
      </BrutalCard>

      {filtered.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {filtered.map((pet, index) => (
            <PetListItem
              key={pet.id}
              pet={pet}
              index={index}
              tone={CARD_TONE[index % CARD_TONE.length]}
              likesCount={likesByPet[pet.id] ?? 0}
              interestedCount={interestedByPet[pet.id] ?? 0}
            />
          ))}
        </ul>
      ) : (
        <BrutalCard className="items-center gap-3 text-center">
          <p role="status" className="text-sm text-neutral-600">
            Nenhum pet encontrado com esses filtros.
          </p>
          {hasFilters ? (
            <BrutalButton
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus(null);
                setSpecies(null);
              }}
            >
              Limpar filtros
            </BrutalButton>
          ) : null}
        </BrutalCard>
      )}
    </>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <BrutalButton
      variant={active ? "primary" : "outline"}
      size="sm"
      aria-pressed={active}
      onClick={onClick}
      className="min-h-8 rounded-full"
    >
      {children}
    </BrutalButton>
  );
}
