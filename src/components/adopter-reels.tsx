"use client";

import { AdopterPetActions } from "@/components/adopter-pet-card";
import { PawIcon } from "@/components/paw-icon";
import { Badge, Card, cn, shadowSoft } from "@/components/ui";
import { formatDistanceKm } from "@/lib/format-distance";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SIZE_LABEL,
  PET_SPECIES_LABEL,
  type Pet,
} from "@/lib/pet";
import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type ReelsItem = {
  pet: Pet;
  ongName: string;
  city: string;
  distanceKm: number | null;
  liked: boolean;
  interested: boolean;
};

/**
 * Descoberta em rolagem vertical (estilo Reels): um pet por vez ocupando a
 * tela, que "encaixa" a cada deslize. Favoritar, descartar e "Quero adotar"
 * ficam no próprio cartão.
 */
export function AdopterReels({
  items,
  hasPhone,
}: {
  items: ReelsItem[];
  hasPhone: boolean;
}) {
  return (
    <ul
      aria-label="Pets para adoção, um por vez"
      className="flex h-[calc(100dvh-15rem)] min-h-[26rem] snap-y snap-mandatory flex-col gap-3 overflow-y-auto rounded-3xl"
    >
      {items.map(({ pet, ongName, city, distanceKm, liked, interested }) => {
        const photoUrl = pet.photos[0]?.url;
        return (
          <li
            key={pet.id}
            className={cn(
              "flex h-full shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white",
              shadowSoft.md,
            )}
          >
            <Link
              href={`/pets/${pet.id}`}
              className="relative min-h-0 flex-1 bg-primary-faint focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none"
            >
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={`Foto de ${pet.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 480px"
                  className="object-cover"
                />
              ) : (
                <PawIcon className="absolute inset-0 m-auto size-16 text-neutral-900/30" />
              )}
              {pet.photos.length > 1 ? (
                <Badge
                  tone="neutral"
                  size="sm"
                  className="absolute top-3 right-3"
                >
                  {pet.photos.length} fotos
                </Badge>
              ) : null}
            </Link>
            <div className="flex flex-col gap-2 p-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  {pet.name}
                </h2>
                <p className="text-sm text-neutral-900">
                  {PET_SPECIES_LABEL[pet.species]}
                  {pet.breed ? ` · ${pet.breed}` : ""} ·{" "}
                  {PET_AGE_GROUP_LABEL[pet.ageGroup]} · {PET_SEX_LABEL[pet.sex]}{" "}
                  · Porte {PET_SIZE_LABEL[pet.size].toLowerCase()}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-600">
                  <MapPin className="size-3" aria-hidden="true" />
                  {ongName}
                  {city ? ` · ${city}` : ""}
                  {distanceKm !== null
                    ? ` · a ${formatDistanceKm(distanceKm)}`
                    : ""}
                </p>
              </div>
              {pet.temperament.length > 0 ? (
                <ul className="flex flex-wrap gap-1">
                  {pet.temperament.slice(0, 4).map((tag) => (
                    <li key={tag}>
                      <Badge tone="neutral" size="sm">
                        {tag}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : null}
              <AdopterPetActions
                petId={pet.id}
                petName={pet.name}
                ongName={ongName}
                liked={liked}
                interested={interested}
                hasPhone={hasPhone}
              />
            </div>
          </li>
        );
      })}
      <li className="shrink-0">
        <Card className="items-center gap-1 text-center">
          <p className="text-sm font-bold text-neutral-900">
            Você viu todos por enquanto.
          </p>
          <p className="text-sm text-neutral-600">
            Volte mais tarde: novos pets aparecem aqui.
          </p>
        </Card>
      </li>
    </ul>
  );
}
