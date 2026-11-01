import { FollowButton } from "@/components/adopter/adopter-feed";
import { AdopterPetActions } from "@/components/adopter/adopter-pet-card";
import { AdopterTabBar } from "@/components/adopter/adopter-tab-bar";
import { PawIcon } from "@/components/brand/paw-icon";
import { NgoPostHeader } from "@/components/ngo/ngo-post-header";
import { PostMediaCarousel } from "@/components/posts/post-media-carousel";
import { LinkButton, PageShell, TextLink } from "@/components/ui";
import { listDislikedPetIds } from "@/lib/dislikes";
import { listFollowedNgoIds } from "@/lib/follows";
import { distanceKmBetweenPostalCodes, formatDistanceKm } from "@/lib/geo";
import { listNotificationsByAdopter } from "@/lib/notifications";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SIZE_LABEL,
  PET_SPECIES_LABEL,
  PET_STATUS_LABEL,
  type PetSpecies,
} from "@/lib/pet";
import { getNgoInfoMap, getPetById } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import {
  Bird,
  CalendarDays,
  Cat,
  Check,
  ChevronLeft,
  Dog,
  HeartHandshake,
  MapPin,
  Mars,
  Navigation,
  PawPrint,
  Ruler,
  Venus,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Detalhes do pet – Petfinder",
};

const SPECIES_ICONS: Record<PetSpecies, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  other: PawPrint,
};

/** Adopter pet details, photos, history, NGO information, and actions. */
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

  const [followedIds, ngoInfo, notifications, dislikedIds] = await Promise.all([
    listFollowedNgoIds(user.id),
    getNgoInfoMap(),
    listNotificationsByAdopter(user.id),
    listDislikedPetIds(user.id),
  ]);
  const ngo = ngoInfo.get(pet.ngoId);
  const adopterPostalCode = user.adopter.personal.address.postalCode;
  const distanceKm =
    ngo?.postalCode && adopterPostalCode
      ? await distanceKmBetweenPostalCodes(ngo.postalCode, adopterPostalCode)
      : null;
  const liked = notifications.some(
    (n) => n.petId === pet.id && n.type === "like",
  );
  const interested = notifications.some(
    (n) => n.petId === pet.id && n.type === "interest",
  );

  const photos = pet.photos.filter(
    (photo): photo is typeof photo & { url: string } => photo.url !== null,
  );
  const health = [
    pet.health.vaccinated ? "Vacinado" : null,
    pet.health.neutered ? "Castrado" : null,
    pet.health.dewormed ? "Vermifugado" : null,
  ].filter((item): item is string => item !== null);

  const facts = [
    {
      label: "Espécie",
      value: PET_SPECIES_LABEL[pet.species],
      icon: SPECIES_ICONS[pet.species],
    },
    {
      label: "Idade",
      value: PET_AGE_GROUP_LABEL[pet.ageGroup],
      icon: CalendarDays,
    },
    {
      label: "Sexo",
      value: PET_SEX_LABEL[pet.sex],
      icon: pet.sex === "female" ? Venus : Mars,
    },
    {
      label: "Porte",
      icon: Ruler,
      value: `${PET_SIZE_LABEL[pet.size]}${pet.sizeCm ? ` · ~${pet.sizeCm.toLocaleString("pt-BR")} cm` : ""}`,
    },
  ];

  return (
    <PageShell
      hasActionBar
      className="px-0! pt-[calc(3rem+env(safe-area-inset-top))]!"
    >
      <article className="min-w-0 bg-white text-text">
        <nav
          aria-label="Voltar ao início"
          className="border-b border-border-light px-4 py-2"
        >
          <TextLink
            href="/"
            tone="brutal"
            className="inline-flex min-h-11 items-center gap-2 text-sm no-underline hover:underline"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
            Voltar ao início
          </TextLink>
        </nav>
        <NgoPostHeader
          name={ngo?.name ?? "ONG responsável"}
          nickname={ngo?.nickname ?? "ong"}
          logoUrl={ngo?.logoUrl ?? null}
        />
        {photos.length > 0 ? (
          <PostMediaCarousel
            post={{
              media: photos.map((photo) => ({
                ...photo,
                type: "image" as const,
              })),
            }}
            petName={pet.name}
            tone="bg-secondary"
            edgeToEdge
            enablePhotoViewer
            showTag={false}
          />
        ) : (
          <div className="flex aspect-square flex-col items-center justify-center gap-3 bg-secondary px-6 text-center">
            <PawIcon
              className="size-12 text-accent-tertiary"
              aria-hidden="true"
            />
            <p className="text-sm text-neutral-600">
              A ONG ainda não colocou fotos de {pet.name}.
            </p>
          </div>
        )}
        <header className="flex flex-col gap-3 px-4 pt-5 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="min-w-0 text-3xl font-bold break-words">
              {pet.name}
            </h1>
            <p
              className={
                pet.status === "available"
                  ? "text-sm font-medium text-accent-tertiary"
                  : "text-sm font-medium text-neutral-600"
              }
            >
              {PET_STATUS_LABEL[pet.status]}
            </p>
          </div>
          {ngo?.city ? (
            <p className="flex items-center gap-1.5 text-sm text-neutral-600">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {ngo.city}
            </p>
          ) : null}
          <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl bg-secondary p-4">
            {facts.map(({ label, value, icon: Icon }) => (
              <div key={label} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-xs text-neutral-600">
                  <Icon
                    className="size-4 shrink-0 text-text"
                    aria-hidden="true"
                  />
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </header>
        <section
          aria-label="Favoritar e pedir adoção"
          className="border-b border-border-light px-4 pb-5"
        >
          {pet.status !== "available" && !interested ? (
            <p
              role="status"
              className="mb-3 text-sm font-medium text-neutral-600"
            >
              {pet.name} não está mais disponível para novos pedidos de adoção.
            </p>
          ) : null}
          <AdopterPetActions
            layout="details"
            disliked={dislikedIds.includes(pet.id)}
            petId={pet.id}
            petName={pet.name}
            ngoName={ngo?.name ?? "a ONG"}
            liked={liked}
            interested={interested}
            hasPhone={Boolean(user.adopter.personal.phone)}
          />
        </section>
        <section
          aria-labelledby="pet-about"
          className="flex flex-col gap-3 border-b border-border-light px-4 py-5"
        >
          <h2 id="pet-about" className="text-lg font-bold">
            Sobre {pet.name}
          </h2>
          {pet.breed ? (
            <p className="text-sm text-neutral-600">Raça: {pet.breed}</p>
          ) : null}
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {pet.description}
          </p>
          {pet.temperament.length > 0 ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">Jeito de ser</h3>
              <p className="text-sm leading-relaxed text-neutral-600">
                {pet.temperament.join(", ")}
              </p>
            </div>
          ) : null}
        </section>
        {health.length > 0 || pet.health.specialNeeds ? (
          <section
            aria-labelledby="pet-health"
            className="flex flex-col gap-3 border-b border-border-light px-4 py-5"
          >
            <h2 id="pet-health" className="text-lg font-bold">
              Saúde e cuidados
            </h2>
            {health.length > 0 ? (
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-accent-tertiary">
                {health.map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="size-4" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            {pet.health.specialNeeds ? (
              <div className="rounded-2xl bg-secondary p-4">
                <h3 className="text-sm font-semibold">Cuidados especiais</h3>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">
                  {pet.health.specialNeeds}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}
        {ngo ? (
          <section
            aria-labelledby="pet-ngo"
            className="flex flex-col gap-3 px-4 py-5"
          >
            <h2 id="pet-ngo" className="text-lg font-bold">
              Quem cuida de {pet.name}
            </h2>
            <p className="text-sm font-semibold">{ngo.name}</p>
            {ngo.city ? (
              <p className="flex items-center gap-1.5 text-sm text-neutral-600">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {ngo.city}
              </p>
            ) : null}
            {distanceKm !== null ? (
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-accent-tertiary">
                  <Navigation className="size-4 shrink-0" aria-hidden="true" />A{" "}
                  {formatDistanceKm(distanceKm)} de você
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  Distância em linha reta, aproximada.
                </p>
              </div>
            ) : !adopterPostalCode ? (
              <p className="text-sm text-neutral-600">
                Quer saber a distância até a ONG?{" "}
                <TextLink href="/me">
                  Informe seu CEP em Identificação no perfil
                </TextLink>
                .
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-start gap-3">
              <FollowButton
                ngoId={ngo.id}
                ngoName={ngo.name}
                following={followedIds.includes(ngo.id)}
                showHint
              />
              <LinkButton
                href={`/adopter/donate/${ngo.id}`}
                variant="outline"
                size="sm"
                className="min-h-11 shadow-none"
              >
                <HeartHandshake className="size-4" aria-hidden="true" />
                Doar para esta ONG
              </LinkButton>
            </div>
          </section>
        ) : null}
      </article>
      <AdopterTabBar />
    </PageShell>
  );
}
