import {
  AdopterFeedPost,
  AdopterFeedTabs,
  FeedEmpty,
  FollowButton,
} from "@/components/adopter-feed";
import { AdopterPetCard } from "@/components/adopter-pet-card";
import { AdopterTabBar } from "@/components/adopter-tab-bar";
import { BrutalLinkButton } from "@/components/brutal-button";
import { LocationButton } from "@/components/location-button";
import { LogoutButton } from "@/components/logout-button";
import { OngPetsPhotoFeed } from "@/components/ong-pets-photo-feed";
import { OngProfileCard } from "@/components/ong-profile-card";
import { OngTabBar } from "@/components/ong-tab-bar";
import { OngVerificationChecklistCard } from "@/components/ong-verification-checklist-card";
import { PawIcon } from "@/components/paw-icon";
import { Card, iconSize, LinkButton, PageShell } from "@/components/ui";
import { VerificationBadge } from "@/components/verification-badge";
import {
  ADOPTER_VERIFICATION_STATUS_LABEL,
  getAdopterChecklist,
} from "@/lib/adopter";
import { adopterNextActionLabel } from "@/lib/adoption";
import { getAlerts } from "@/lib/alerts";
import { listDislikedPetIds } from "@/lib/dislikes";
import { listFollowedOngIds } from "@/lib/follows";
import { distancesForAdopter } from "@/lib/location";
import {
  countNotificationsByPet,
  listNotificationsByAdopter,
  listNotificationsByOng,
} from "@/lib/notifications";
import type { Pet } from "@/lib/pet";
import { getOngInfoMap, listAvailablePets, listPetsByOng } from "@/lib/pets";
import type { Post } from "@/lib/post";
import { listPostsByOng, readPosts } from "@/lib/posts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import {
  HandHeart,
  HeartHandshake,
  Layers,
  Settings,
  ThumbsDown,
} from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const CARD_TONE = ["bg-primary-faint", "bg-accent-yellow", "bg-accent-peach"];

export default async function App({
  searchParams,
}: {
  searchParams: Promise<{ criado?: string }>;
}) {
  const { criado } = await searchParams;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ong" && user.ong) {
    const ong = user.ong;
    const status = ong.verification.status;
    const verified = status === "verificada";

    const [allPets, notifications, posts] = await Promise.all([
      listPetsByOng(user.id),
      listNotificationsByOng(user.id),
      listPostsByOng(user.id),
    ]);
    const pets = allPets.filter((pet) => !pet.archived);
    const unreadCount = notifications.filter((n) => n.readAt === null).length;
    const likesByPet = countNotificationsByPet(notifications, "curtida");
    const interestedByPet = countNotificationsByPet(notifications, "interesse");

    return (
      <PageShell hasActionBar>
        <OngProfileCard ong={ong} pets={pets}>
          <div className="flex flex-col gap-2">
            <BrutalLinkButton
              href="/ong/configuracoes"
              variant="outline"
              size="md"
            >
              <Settings className={iconSize.md} aria-hidden="true" />
              Configurações
            </BrutalLinkButton>
            {verified ? (
              <>
                <BrutalLinkButton href="/ong/pets/novo" size="md">
                  Cadastrar pet
                </BrutalLinkButton>
                <BrutalLinkButton href="/ong/pets" variant="outline" size="md">
                  Meus pets ({pets.length})
                </BrutalLinkButton>
              </>
            ) : null}
            <LogoutButton brutal />
          </div>
        </OngProfileCard>

        {criado === "pet" || criado === "post" ? (
          <Card role="status" tone="success">
            <p className="text-sm font-bold text-lime-800">
              ✓ {criado === "pet" ? "Pet cadastrado!" : "Post publicado!"}
            </p>
            <p className="text-sm text-neutral-900">
              {criado === "pet"
                ? "Ele já aparece para quem quer adotar. Toque em Cadastrar pet para adicionar outro."
                : "Ele já aparece abaixo, em Fotos dos pets."}
            </p>
          </Card>
        ) : null}

        {!verified ? (
          <OngVerificationChecklistCard ong={ong} />
        ) : (
          <OngPetsPhotoFeed
            posts={posts}
            pets={allPets}
            ongName={ong.legal.tradeName}
            ongNickname={ong.legal.nickname}
            ongLogoUrl={ong.publicProfile.logo?.url ?? null}
            likesByPet={likesByPet}
            interestedByPet={interestedByPet}
          />
        )}

        <OngTabBar unreadCount={unreadCount} />
      </PageShell>
    );
  }

  if (user.role === "adopter" && user.adopter) {
    const adopter = user.adopter;
    const status = adopter.verification.status;
    const checklist = getAdopterChecklist(adopter);
    const done = checklist.filter((item) => item.done).length;

    const [
      allAvailable,
      posts,
      ongInfo,
      myNotifications,
      followedIds,
      dislikedIds,
    ] = await Promise.all([
      listAvailablePets(),
      readPosts(),
      getOngInfoMap(),
      listNotificationsByAdopter(user.id),
      listFollowedOngIds(user.id),
      listDislikedPetIds(user.id),
    ]);
    // "Não tenho interesse" tira o pet do feed (fica em /adotante/descartados).
    const dislikedSet = new Set(dislikedIds);
    const pets = allAvailable.filter((pet) => !dislikedSet.has(pet.id));
    // Mais perto primeiro quando o adotante informou o CEP no perfil.
    const { distances: distanceByOng, source: locationSource } =
      await distancesForAdopter(adopter.personal.address.cep, ongInfo);
    const likedPetIds = new Set(
      myNotifications.filter((n) => n.type === "curtida").map((n) => n.petId),
    );
    const interestedPetIds = new Set(
      myNotifications.filter((n) => n.type === "interesse").map((n) => n.petId),
    );
    const followed = new Set(followedIds);
    const petsById = new Map(pets.map((pet) => [pet.id, pet]));

    // Feed estilo Instagram: posts das ONGs verificadas (com o pet marcado, se
    // ainda disponível) + pets disponíveis que ainda não aparecem em nenhum post.
    const verifiedOngIds = new Set(pets.map((pet) => pet.ongId));
    const petIdsInPosts = new Set(
      posts.flatMap((post) => (post.petId ? [post.petId] : [])),
    );
    type FeedItem =
      | { kind: "post"; createdAt: string; post: Post; pet: Pet | null }
      | { kind: "pet"; createdAt: string; pet: Pet };
    const items: FeedItem[] = [
      ...posts
        .filter(
          (post) =>
            ongInfo.has(post.ongId) &&
            (verifiedOngIds.has(post.ongId) || petsById.has(post.petId ?? "")),
        )
        .map((post): FeedItem => ({
          kind: "post",
          createdAt: post.createdAt,
          post,
          pet: post.petId ? (petsById.get(post.petId) ?? null) : null,
        })),
      ...pets
        .filter((pet) => !petIdsInPosts.has(pet.id))
        .map((pet): FeedItem => ({
          kind: "pet",
          createdAt: pet.createdAt,
          pet,
        })),
    ].sort((a, b) => {
      const ongA = a.kind === "post" ? a.post.ongId : a.pet.ongId;
      const ongB = b.kind === "post" ? b.post.ongId : b.pet.ongId;
      const distA = distanceByOng.get(ongA) ?? null;
      const distB = distanceByOng.get(ongB) ?? null;
      if (
        distA !== null &&
        distB !== null &&
        Math.round(distA) !== Math.round(distB)
      )
        return distA - distB;
      if (distA !== null && distB === null) return -1;
      if (distA === null && distB !== null) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    function renderItems(list: FeedItem[]) {
      return (
        <ul className="flex flex-col gap-3">
          {list.map((item, index) => {
            const ong = ongInfo.get(
              item.kind === "post" ? item.post.ongId : item.pet.ongId,
            );
            if (!ong) return null;
            return item.kind === "post" ? (
              <AdopterFeedPost
                key={`post-${item.post.id}`}
                post={item.post}
                pet={item.pet}
                ong={ong}
                index={index}
                following={followed.has(ong.id)}
                liked={item.pet ? likedPetIds.has(item.pet.id) : false}
                interested={
                  item.pet ? interestedPetIds.has(item.pet.id) : false
                }
                hasPhone={Boolean(adopter.personal.phone)}
              />
            ) : (
              <AdopterPetCard
                key={`pet-${item.pet.id}`}
                pet={item.pet}
                tone={CARD_TONE[index % CARD_TONE.length]}
                liked={likedPetIds.has(item.pet.id)}
                interested={interestedPetIds.has(item.pet.id)}
                ongName={ong.name}
                city={ong.city}
                distanceKm={distanceByOng.get(ong.id) ?? null}
                hasPhone={Boolean(adopter.personal.phone)}
              />
            );
          })}
        </ul>
      );
    }

    const followingItems = items.filter((item) =>
      followed.has(item.kind === "post" ? item.post.ongId : item.pet.ongId),
    );

    const alerts = await getAlerts(user.id, "adopter");

    return (
      <PageShell hasActionBar>
        {alerts.chats > 0 || alerts.adoptionsToAct.length > 0 ? (
          <Card role="status" tone="highlight" className="gap-2">
            <p className="text-sm font-bold text-neutral-900">
              Tem novidade para você
            </p>
            <ul className="flex flex-col gap-1.5">
              {alerts.adoptionsToAct.map((adoption) => (
                <li key={adoption.id}>
                  <Link
                    href={`/adotante/adocoes/${adoption.id}`}
                    className="text-sm font-bold text-neutral-900 underline"
                  >
                    {adoption.petName}:{" "}
                    {adopterNextActionLabel(adoption) ?? "ver a adoção"}
                  </Link>
                </li>
              ))}
              {alerts.chats > 0 ? (
                <li>
                  <Link
                    href="/adotante/conversas"
                    className="text-sm font-bold text-neutral-900 underline"
                  >
                    {alerts.chats === 1
                      ? "1 mensagem nova nas conversas"
                      : `${alerts.chats} mensagens novas nas conversas`}
                  </Link>
                </li>
              ) : null}
            </ul>
          </Card>
        ) : null}

        <Card as="header" className="gap-2">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft"
            >
              {adopter.personal.avatar?.url ? (
                <Image
                  src={adopter.personal.avatar.url}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <PawIcon className="size-6 text-lime-800" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-neutral-900">
                {user.name}
              </h1>
              <VerificationBadge
                status={status}
                label={ADOPTER_VERIFICATION_STATUS_LABEL[status]}
                size="sm"
              />
            </div>
            {status === "verificada" ? null : (
              <LinkButton href="/adotante/perfil" size="sm">
                {status === "pendente" ? "Completar" : "Ver perfil"}
              </LinkButton>
            )}
          </div>
          {status === "pendente" ? (
            <p className="text-xs text-neutral-900">
              Perfil: {done} de {checklist.length} passos. Você já pode pedir
              para adotar, mas ONGs confiam mais em perfis completos.
            </p>
          ) : null}
          {status === "pendente" ? (
            <details className="text-xs text-neutral-900">
              <summary className="cursor-pointer font-bold">
                Ver os {checklist.length} passos
              </summary>
              <ul className="mt-1 flex flex-col gap-1">
                {checklist.map((item) => (
                  <li key={item.id}>
                    {item.done
                      ? `Feito: ${item.label}`
                      : `Falta: ${item.missing || item.label}`}
                  </li>
                ))}
              </ul>
            </details>
          ) : status === "em_analise" ? (
            <p className="text-xs text-neutral-900">
              Estamos conferindo seu perfil. Avisamos por e-mail quando
              terminar.
            </p>
          ) : null}
        </Card>

        <nav aria-label="Outras formas de ver os pets" className="flex gap-2">
          <LinkButton
            href="/adotante/descobrir"
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            <Layers className={iconSize.sm} aria-hidden="true" />
            Modo rolagem
          </LinkButton>
          <LinkButton
            href="/adotante/descartados"
            variant="pill"
            size="sm"
            className="flex-1"
          >
            <ThumbsDown className={iconSize.sm} aria-hidden="true" />
            Descartados
          </LinkButton>
        </nav>

        <nav aria-label="Ajudar as ONGs" className="flex gap-2">
          <LinkButton
            href="/adotante/doar"
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <HeartHandshake className={iconSize.sm} aria-hidden="true" />
            Doar para ONG
          </LinkButton>
          <LinkButton
            href="/adotante/acolhimentos/novo"
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <HandHeart className={iconSize.sm} aria-hidden="true" />
            Deixar um pet
          </LinkButton>
        </nav>

        <LocationButton active={locationSource === "gps"} />

        <AdopterFeedTabs
          followingCount={followedIds.length}
          recommended={
            items.length > 0 ? (
              renderItems(items)
            ) : (
              <FeedEmpty>
                Nenhum pet disponível para adoção no momento.
              </FeedEmpty>
            )
          }
          following={
            followingItems.length > 0 ? (
              <div className="flex flex-col gap-3">
                <Card className="gap-2">
                  <p className="text-sm font-bold text-neutral-900">
                    ONGs que você segue
                  </p>
                  <ul className="flex flex-col gap-2">
                    {followedIds.map((id) => {
                      const ong = ongInfo.get(id);
                      return ong ? (
                        <li
                          key={id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="min-w-0 text-sm text-neutral-900">
                            {ong.name}
                          </span>
                          <FollowButton
                            ongId={ong.id}
                            ongName={ong.name}
                            following
                          />
                        </li>
                      ) : null;
                    })}
                  </ul>
                </Card>
                {renderItems(followingItems)}
              </div>
            ) : (
              <FeedEmpty>
                {followedIds.length === 0
                  ? "Você ainda não segue nenhuma ONG. Abra um pet e toque em Seguir na ONG dele para ver as novidades dela aqui."
                  : "As ONGs que você segue ainda não publicaram pets."}
              </FeedEmpty>
            )
          }
        />

        <AdopterTabBar />
      </PageShell>
    );
  }

  return (
    <PageShell className="justify-center">
      <p className="text-center text-sm text-neutral-600">Conteúdo principal</p>
    </PageShell>
  );
}
