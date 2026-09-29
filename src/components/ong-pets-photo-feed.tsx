"use client";

import { BrutalLinkButton } from "@/components/brutal-button";
import { BrutalCard } from "@/components/brutal-card";
import { PawIcon } from "@/components/paw-icon";
import { PetCardMenu } from "@/components/pet-card-menu";
import { Badge, cn, iconSize } from "@/components/ui";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SPECIES_LABEL,
  type Pet,
} from "@/lib/pet";
import { Heart, LayoutGrid, List, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type View = "grid" | "list";

/** Pastel, mas mais vivo que os tokens do resto do app — só para o balão do nome. */
const BUBBLE_TONE = [
  "bg-yellow-200",
  "bg-emerald-200",
  "bg-orange-200",
  "bg-purple-200",
];
const TAG_TONE = ["bg-green-100!", "bg-amber-100!", "bg-rose-100!"];

function PhotoCell({ pet }: { pet: Pet }) {
  const photoUrl = pet.photos[0]?.url;

  return (
    <span className="relative aspect-square overflow-hidden rounded-lg border border-neutral-900 bg-white/40">
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={pet.name}
          fill
          sizes="(max-width: 640px) 33vw, 200px"
          className="object-cover"
        />
      ) : (
        <PawIcon className="absolute inset-0 m-auto size-6 text-neutral-900/30" />
      )}
    </span>
  );
}

function PetPost({
  pet,
  tone,
  ongName,
  ongNickname,
  ongLogoUrl,
  likesCount,
  interestedCount,
}: {
  pet: Pet;
  tone: string;
  ongName: string;
  ongNickname: string;
  ongLogoUrl: string | null;
  likesCount: number;
  interestedCount: number;
}) {
  const photoUrl = pet.photos[0]?.url;

  return (
    <li className="flex flex-col rounded-xl border border-neutral-900 bg-white">
      <div className="flex items-center gap-2 rounded-t-xl border-b border-neutral-900 bg-white px-2 py-1.5">
        <span className="relative size-8 shrink-0 overflow-hidden rounded-full border border-neutral-900 bg-primary-soft">
          {ongLogoUrl ? (
            <Image
              src={ongLogoUrl}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <PawIcon className="absolute inset-0 m-auto size-4 text-neutral-900" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-neutral-900">
            {ongName}
          </p>
          <p className="truncate text-xs text-neutral-600">@{ongNickname}</p>
        </div>
        <PetCardMenu pet={pet} />
      </div>

      <span className="relative aspect-square w-full bg-white/40">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={pet.name}
            fill
            sizes="(max-width: 640px) 100vw, 500px"
            className="object-cover"
          />
        ) : (
          <PawIcon className="absolute inset-0 m-auto size-8 text-neutral-900/30" />
        )}
        <span className="absolute bottom-3 left-3">
          <span
            className={cn(
              "relative inline-block rounded-2xl border-2 border-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-900",
              tone,
            )}
          >
            {pet.name}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "absolute -bottom-[7px] left-4 size-3 rotate-45 border-r-2 border-b-2 border-neutral-900",
              tone,
            )}
          />
        </span>
      </span>

      <div className="flex items-center gap-1 border-t border-neutral-900 px-1 py-1">
        <span className="relative flex size-9 items-center justify-center text-neutral-900">
          <Heart className="size-5" aria-hidden="true" />
          {likesCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-[9px] font-bold text-white"
            >
              {likesCount > 9 ? "9+" : likesCount}
            </span>
          ) : null}
          <span className="sr-only">{likesCount} curtidas de adotantes</span>
        </span>

        <Link
          href={`/ong/mensagens?pet=${pet.id}`}
          className="relative flex size-9 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          {interestedCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-[9px] font-bold text-white"
            >
              {interestedCount > 9 ? "9+" : interestedCount}
            </span>
          ) : null}
          <span className="sr-only">
            {interestedCount} adotantes interessados em adotar {pet.name} — ver
            mensagens
          </span>
        </Link>
      </div>

      <p className="px-3 pt-1 text-sm text-neutral-900">
        <span className="font-bold text-neutral-900">@{ongNickname}</span>{" "}
        {pet.description}
      </p>

      <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-3">
        {[
          PET_SPECIES_LABEL[pet.species],
          pet.breed,
          PET_AGE_GROUP_LABEL[pet.ageGroup],
          PET_SEX_LABEL[pet.sex],
        ]
          .filter(Boolean)
          .map((label, index) => (
            <Badge
              key={index}
              tone="outline"
              size="sm"
              className={TAG_TONE[index % TAG_TONE.length]}
            >
              {label}
            </Badge>
          ))}
      </div>
    </li>
  );
}

/** Feed de fotos dos pets no Perfil, com alternância grade/lista (estilo Instagram). */
export function OngPetsPhotoFeed({
  pets,
  ongName,
  ongNickname,
  ongLogoUrl,
  likesByPet,
  interestedByPet,
}: {
  pets: Pet[];
  ongName: string;
  ongNickname: string;
  ongLogoUrl: string | null;
  likesByPet: Record<string, number>;
  interestedByPet: Record<string, number>;
}) {
  const [view, setView] = useState<View>("grid");

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-neutral-600">
          <PawIcon className={iconSize.md} aria-hidden="true" />
          <span className="text-xs font-bold tracking-wide uppercase">
            Fotos dos pets
          </span>
        </div>

        <div
          role="group"
          aria-label="Modo de visualização"
          className="flex items-center gap-1"
        >
          <button
            type="button"
            aria-label="Ver em grade"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
            className={cn(
              "flex size-8 items-center justify-center rounded-full",
              view === "grid"
                ? "text-neutral-900"
                : "text-gray-400 hover:text-neutral-600",
            )}
          >
            <LayoutGrid
              className={iconSize.md}
              strokeWidth={view === "grid" ? 2.75 : 2}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            aria-label="Ver em lista"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={cn(
              "flex size-8 items-center justify-center rounded-full",
              view === "list"
                ? "text-neutral-900"
                : "text-gray-400 hover:text-neutral-600",
            )}
          >
            <List
              className={iconSize.md}
              strokeWidth={view === "list" ? 2.75 : 2}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {pets.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-3 gap-1">
            {pets.map((pet) => (
              <PhotoCell key={pet.id} pet={pet} />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {pets.map((pet, index) => (
              <PetPost
                key={pet.id}
                pet={pet}
                tone={BUBBLE_TONE[index % BUBBLE_TONE.length]}
                ongName={ongName}
                ongNickname={ongNickname}
                ongLogoUrl={ongLogoUrl}
                likesCount={likesByPet[pet.id] ?? 0}
                interestedCount={interestedByPet[pet.id] ?? 0}
              />
            ))}
          </ul>
        )
      ) : (
        <BrutalCard className="items-center gap-3 text-center">
          <p className="text-sm text-neutral-600">
            Você ainda não cadastrou nenhum pet.
          </p>
          <BrutalLinkButton href="/ong/pets/novo" size="md">
            Cadastrar primeiro pet
          </BrutalLinkButton>
        </BrutalCard>
      )}
    </div>
  );
}
