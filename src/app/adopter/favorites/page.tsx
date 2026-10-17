import { AdopterTabBar } from "@/components/adopter/adopter-tab-bar";
import { FeedPost } from "@/components/posts/feed-post";
import { LinkButton, PageShell } from "@/components/ui";
import { listDislikedPetIds } from "@/lib/dislikes";
import { listNotificationsByAdopter } from "@/lib/notifications";
import { getNgoInfoMap, readPets } from "@/lib/pets";
import { readPosts } from "@/lib/posts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { Heart } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Favoritos – Petfinder",
};

export default async function AdopterFavoritesPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const [notifications, allPets, ngoInfo, posts, hiddenIds] = await Promise.all(
    [
      listNotificationsByAdopter(user.id),
      readPets(),
      getNgoInfoMap(),
      readPosts(),
      listDislikedPetIds(user.id),
    ],
  );
  const likedIds = new Set(
    notifications.filter((n) => n.type === "like").map((n) => n.petId),
  );
  const pets = allPets.filter((pet) => likedIds.has(pet.id) && !pet.archived);

  const hiddenPetIds = new Set(hiddenIds);
  const petById = new Map(pets.map((pet) => [pet.id, pet]));
  const latestPostByPet = new Map<string, (typeof posts)[number]>();
  for (const post of posts) {
    if (!post.petId || petById.get(post.petId)?.ngoId !== post.ngoId) continue;
    const previous = latestPostByPet.get(post.petId);
    if (!previous || post.createdAt > previous.createdAt)
      latestPostByPet.set(post.petId, post);
  }

  return (
    <PageShell
      hasActionBar
      className="px-0! pt-[calc(3rem+env(safe-area-inset-top))]!"
    >
      <header className="border-b border-border-light px-4 py-5">
        <h1 className="text-xl font-bold text-text">Favoritos</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Os pets que você curtiu, reunidos aqui.
        </p>
        {pets.length > 0 ? (
          <p className="mt-3 text-sm font-medium text-accent-tertiary">
            {pets.length === 1
              ? "1 pet favorito"
              : `${pets.length} pets favoritos`}
          </p>
        ) : null}
      </header>
      {pets.length === 0 ? (
        <section
          className="flex flex-col items-center gap-4 px-6 py-16 text-center"
          aria-labelledby="favorites-empty-title"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-accent-tertiary">
            <Heart className="size-8" aria-hidden="true" />
          </span>
          <h2 id="favorites-empty-title" className="text-lg font-bold">
            Seus favoritos começam com uma curtida
          </h2>
          <p className="max-w-xs text-sm text-neutral-600">
            Toque no coração das publicações no início para guardar os pets que
            você quer conhecer melhor.
          </p>
          <LinkButton href="/" variant="primary">
            Encontrar um pet
          </LinkButton>
        </section>
      ) : (
        <ul
          aria-label="Pets favoritos"
          className="flex flex-col divide-y divide-border-light"
        >
          {pets.map((pet) => {
            const ngo = ngoInfo.get(pet.ngoId);
            const taggedPost = latestPostByPet.get(pet.id);
            const post = taggedPost?.ngoId === pet.ngoId ? taggedPost : null;
            return (
              <FeedPost
                key={pet.id}
                item={{
                  id: `favorite-${pet.id}`,
                  post,
                  pet,
                  ngo: {
                    name: ngo?.name ?? "ONG",
                    nickname: ngo?.nickname ?? "ong",
                    logoUrl: ngo?.logoUrl ?? null,
                  },
                  liked: true,
                  isHidden: hiddenPetIds.has(pet.id),
                }}
                isHidden={hiddenPetIds.has(pet.id)}
                showPetStatus
              />
            );
          })}
        </ul>
      )}
      <AdopterTabBar />
    </PageShell>
  );
}
