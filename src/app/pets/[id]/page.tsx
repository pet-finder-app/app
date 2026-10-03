import { FollowButton } from "@/components/adopter-feed";
import { AdopterPetActions } from "@/components/adopter-pet-card";
import { AdopterTabBar } from "@/components/adopter-tab-bar";
import { PawIcon } from "@/components/paw-icon";
import {
  Badge,
  Card,
  CardTitle,
  iconSize,
  LinkButton,
  PageShell,
} from "@/components/ui";
import { listDislikedPetIds } from "@/lib/dislikes";
import { listFollowedOngIds } from "@/lib/follows";
import { distanceKmBetweenCeps, formatDistanceKm } from "@/lib/geo";
import { listNotificationsByAdopter } from "@/lib/notifications";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SIZE_LABEL,
  PET_SPECIES_LABEL,
  PET_STATUS_LABEL,
} from "@/lib/pet";
import { getOngInfoMap, getPetById } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import {
  Check,
  ChevronLeft,
  HeartHandshake,
  MapPin,
  Navigation,
} from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Detalhes do pet – Petfinder",
};

/** Página do pet para o adotante: fotos, características, história, ONG e ações. */
export default async function AdopterPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const pet = await getPetById(id);
  if (!pet || pet.archived) notFound();

  const [followedIds, ongInfo, notifications, dislikedIds] = await Promise.all([
    listFollowedOngIds(user.id),
    getOngInfoMap(),
    listNotificationsByAdopter(user.id),
    listDislikedPetIds(user.id),
  ]);
  const ong = ongInfo.get(pet.ongId);
  const adopterCep = user.adopter.personal.address.cep;
  const distanceKm =
    ong?.cep && adopterCep
      ? await distanceKmBetweenCeps(ong.cep, adopterCep)
      : null;
  const liked = notifications.some(
    (n) => n.petId === pet.id && n.type === "curtida",
  );
  const interested = notifications.some(
    (n) => n.petId === pet.id && n.type === "interesse",
  );

  const photos = pet.photos.filter(
    (photo): photo is typeof photo & { url: string } => photo.url !== null,
  );
  const health = [
    pet.health.vaccinated ? "Vacinado" : null,
    pet.health.neutered ? "Castrado" : null,
    pet.health.dewormed ? "Vermifugado" : null,
  ].filter((item): item is string => item !== null);

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-3">
        <LinkButton href="/" variant="pill" size="sm" className="self-start">
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Voltar
        </LinkButton>
        <h1 className="text-2xl font-bold text-neutral-900">{pet.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge tone={pet.status === "disponivel" ? "success" : "warning"}>
            {PET_STATUS_LABEL[pet.status]}
          </Badge>
          <Badge tone="neutral">{PET_SPECIES_LABEL[pet.species]}</Badge>
          <Badge tone="neutral">{PET_AGE_GROUP_LABEL[pet.ageGroup]}</Badge>
          <Badge tone="neutral">{PET_SEX_LABEL[pet.sex]}</Badge>
          <Badge tone="neutral">
            Porte {PET_SIZE_LABEL[pet.size].toLowerCase()}
            {pet.sizeCm ? ` · ~${pet.sizeCm} cm` : ""}
          </Badge>
        </div>
      </Card>

      {photos.length > 0 ? (
        <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-3xl">
          {photos.map((photo, index) => (
            <li
              key={photo.url}
              className="relative aspect-square w-full shrink-0 snap-center overflow-hidden rounded-3xl bg-neutral-100"
            >
              <Image
                src={photo.url}
                alt={`Foto ${index + 1} de ${pet.name}`}
                fill
                sizes="(max-width: 640px) 100vw, 480px"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      ) : (
        <Card className="items-center gap-2 text-center">
          <PawIcon className="size-10 text-neutral-900/30" aria-hidden="true" />
          <p className="text-sm text-neutral-600">
            A ONG ainda não colocou fotos de {pet.name}.
          </p>
        </Card>
      )}

      <Card className="gap-2">
        <CardTitle>Sobre {pet.name}</CardTitle>
        {pet.breed ? (
          <p className="text-sm text-neutral-900">Raça: {pet.breed}</p>
        ) : null}
        <p className="text-sm whitespace-pre-line text-neutral-900">
          {pet.description}
        </p>
        {pet.temperament.length > 0 ? (
          <p className="text-sm text-neutral-900">
            Jeito: {pet.temperament.join(", ")}
          </p>
        ) : null}
        {health.length > 0 ? (
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-lime-800">
            {health.map((item) => (
              <span key={item} className="inline-flex items-center gap-1">
                <Check className="size-4" aria-hidden="true" />
                {item}
              </span>
            ))}
          </p>
        ) : null}
        {pet.health.specialNeeds ? (
          <p className="text-sm text-neutral-900">
            Cuidados especiais: {pet.health.specialNeeds}
          </p>
        ) : null}
      </Card>

      {ong ? (
        <Card className="gap-1">
          <CardTitle>ONG responsável</CardTitle>
          <p className="text-sm font-bold text-neutral-900">{ong.name}</p>
          {distanceKm !== null ? (
            <p className="flex items-center gap-1 text-sm font-bold text-lime-800">
              <Navigation className="size-4" aria-hidden="true" />A{" "}
              {formatDistanceKm(distanceKm)} de você
              <span className="font-normal text-neutral-600">
                {" "}
                (em linha reta, aproximado)
              </span>
            </p>
          ) : !adopterCep ? (
            <p className="text-sm text-neutral-900">
              Quer saber a distância até a ONG?{" "}
              <Link href="/adotante/perfil#cep" className="font-bold underline">
                Informe seu CEP no perfil
              </Link>
              .
            </p>
          ) : null}
          {ong.city ? (
            <p className="flex items-center gap-1 text-sm text-neutral-600">
              <MapPin className="size-4" aria-hidden="true" />
              {ong.city}
            </p>
          ) : null}
          <div className="mt-2 flex flex-col items-start gap-1">
            <FollowButton
              ongId={ong.id}
              ongName={ong.name}
              following={followedIds.includes(ong.id)}
              showHint
            />
            <LinkButton
              href={`/adotante/doar/${ong.id}`}
              variant="outline"
              size="sm"
            >
              <HeartHandshake className={iconSize.sm} aria-hidden="true" />
              Doar para esta ONG
            </LinkButton>
          </div>
        </Card>
      ) : null}

      <Card className="gap-2">
        {pet.status !== "disponivel" && !interested ? (
          <p role="status" className="text-sm font-bold text-neutral-900">
            {pet.name} não está mais disponível para novos pedidos de adoção.
          </p>
        ) : null}
        <AdopterPetActions
          disliked={dislikedIds.includes(pet.id)}
          petId={pet.id}
          petName={pet.name}
          ongName={ong?.name ?? "a ONG"}
          liked={liked}
          interested={interested}
          hasPhone={Boolean(user.adopter.personal.phone)}
        />
      </Card>

      <AdopterTabBar />
    </PageShell>
  );
}
