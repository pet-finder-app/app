import { AdopterTabBar } from "@/components/adopter/adopter-tab-bar";
import { PageShell } from "@/components/ui";
import { adopterNextActionLabel } from "@/lib/adoption";
import { getAlerts } from "@/lib/alerts";
import { listDislikedPetIds } from "@/lib/dislikes";
import {
  distancesForAdopter,
  isLocationEnabled,
  readSavedLocation,
} from "@/lib/location";
import { listNotificationsByAdopter } from "@/lib/notifications";
import type { Pet } from "@/lib/pet";
import { getNgoInfoMap, listAvailablePets } from "@/lib/pets";
import type { Post } from "@/lib/post";
import { listLikedPostIds } from "@/lib/post-likes";
import { readPosts } from "@/lib/posts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { readFeedQuery, type FeedSearchParams } from "./_components/feed-query";
import { HomeFeed, type HomeFeedItem } from "./_components/home-feed";

export default async function App({
  searchParams,
}: {
  searchParams: Promise<FeedSearchParams & { created?: string }>;
}) {
  const query = await searchParams;
  const { created } = query;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ngo") {
    redirect(
      created === "pet" || created === "post"
        ? `/me?created=${created}`
        : "/me",
    );
  }

  if (user.role === "adopter" && user.adopter) {
    const adopter = user.adopter;
    const [locationEnabled, savedLocation] = await Promise.all([
      isLocationEnabled(),
      readSavedLocation(),
    ]);
    const initialFilters = readFeedQuery(query, locationEnabled);

    const [
      allAvailable,
      posts,
      ngoInfo,
      myNotifications,
      dislikedIds,
      likedPostIds,
    ] = await Promise.all([
      listAvailablePets(),
      readPosts(),
      getNgoInfoMap(),
      listNotificationsByAdopter(user.id),
      listDislikedPetIds(user.id),
      listLikedPostIds(user.id),
    ]);
    // Send hidden pets too so the client can reveal them with the visibility filter.
    const dislikedSet = new Set(dislikedIds);
    const pets = allAvailable;
    // Sort by distance when a profile postal code is available.
    const { distances: distanceByNgo } = await distancesForAdopter(
      adopter.personal.address.postalCode,
      ngoInfo,
      initialFilters.locationEnabled,
    );
    const likedPetIds = new Set(
      myNotifications.filter((n) => n.type === "like").map((n) => n.petId),
    );
    const petsById = new Map(pets.map((pet) => [pet.id, pet]));

    // The feed combines verified NGO posts with tagged pets that are
    // still available, plus available pets that are not already represented in posts.
    const verifiedNgoIds = new Set(pets.map((pet) => pet.ngoId));
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
            ngoInfo.has(post.ngoId) &&
            (post.petId
              ? petsById.has(post.petId)
              : verifiedNgoIds.has(post.ngoId)),
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
      const ngoA = a.kind === "post" ? a.post.ngoId : a.pet.ngoId;
      const ngoB = b.kind === "post" ? b.post.ngoId : b.pet.ngoId;
      const distA = distanceByNgo.get(ngoA) ?? null;
      const distB = distanceByNgo.get(ngoB) ?? null;
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

    const feedItems: HomeFeedItem[] = items.flatMap((item) => {
      const ngo = ngoInfo.get(
        item.kind === "post" ? item.post.ngoId : item.pet.ngoId,
      );
      if (!ngo) return [];
      const pet = item.pet;
      return [
        {
          id:
            item.kind === "post"
              ? `post-${item.post.id}`
              : `pet-${item.pet.id}`,
          post: item.kind === "post" ? item.post : null,
          pet,
          isHidden: pet ? dislikedSet.has(pet.id) : false,
          ngo: { name: ngo.name, nickname: ngo.nickname, logoUrl: ngo.logoUrl },
          liked: pet
            ? likedPetIds.has(pet.id)
            : item.kind === "post" && likedPostIds.includes(item.post.id),
        },
      ];
    });

    const alerts = await getAlerts(user.id, "adopter");

    return (
      <PageShell
        hasActionBar
        className="px-0! pt-[calc(3rem+env(safe-area-inset-top))]!"
      >
        <h1 className="sr-only">Publicações das ONGs e pets para adoção</h1>
        <HomeFeed
          items={feedItems}
          isLocationActive={savedLocation !== null}
          isLocationEnabled={locationEnabled}
          initialFilters={initialFilters}
          initialPostId={typeof query.post === "string" ? query.post : null}
          notices={
            alerts.chats > 0 || alerts.adoptionsToAct.length > 0 ? (
              <aside
                aria-label="Suas novidades"
                className="flex flex-col gap-2 border-b border-border-light px-4 py-3 text-sm text-text"
              >
                {alerts.adoptionsToAct.map((adoption) => (
                  <Link
                    key={adoption.id}
                    href={`/adopter/adoptions/${adoption.id}`}
                    className="font-bold underline"
                  >
                    {adoption.petName}:{" "}
                    {adopterNextActionLabel(adoption) ?? "ver a adoção"}
                  </Link>
                ))}
                {alerts.chats > 0 ? (
                  <Link
                    href="/adopter/conversations"
                    className="font-bold underline"
                  >
                    {alerts.chats === 1
                      ? "1 mensagem nova"
                      : `${alerts.chats} mensagens novas`}
                  </Link>
                ) : null}
              </aside>
            ) : null
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
