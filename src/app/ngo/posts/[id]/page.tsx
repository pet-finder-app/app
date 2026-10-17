import { NgoPostCard } from "@/components/ngo/ngo-post-card";
import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { iconSize, PageShell } from "@/components/ui";
import { BrutalLinkButton } from "@/components/ui/brutal-button";
import {
  countNotificationsByPet,
  listNotificationsByNgo,
} from "@/lib/notifications";
import { getPetByIdAndNgo } from "@/lib/pets";
import { getPostByIdAndNgo } from "@/lib/posts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Post – Petfinder",
};

/** Open an individual post from the profile grid. */
export default async function NgoPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const post = await getPostByIdAndNgo(id, user.id);
  if (!post) notFound();

  const [pet, notifications] = await Promise.all([
    post.petId ? getPetByIdAndNgo(post.petId, user.id) : undefined,
    listNotificationsByNgo(user.id),
  ]);
  const unreadCount = notifications.filter((n) => n.readAt === null).length;
  const likesByPet = countNotificationsByPet(notifications, "like");
  const interestedByPet = countNotificationsByPet(notifications, "interest");
  const ngo = user.ngo;

  return (
    <PageShell hasActionBar>
      <BrutalLinkButton
        href="/me"
        variant="pill"
        size="sm"
        className="self-start"
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Perfil
      </BrutalLinkButton>

      <ul className="flex flex-col">
        <NgoPostCard
          post={post}
          pet={pet ?? null}
          tone="bg-yellow-200"
          ngoName={ngo.legal.tradeName}
          ngoNickname={ngo.legal.nickname}
          ngoLogoUrl={ngo.publicProfile.logo?.url ?? null}
          likesCount={pet ? (likesByPet[pet.id] ?? 0) : 0}
          interestedCount={pet ? (interestedByPet[pet.id] ?? 0) : 0}
          redirectTo="/"
        />
      </ul>

      <BrutalLinkButton href={`/ngo/posts/${post.id}/edit`} size="md">
        <Pencil className={iconSize.md} aria-hidden="true" />
        Editar post
      </BrutalLinkButton>

      <NgoTabBar unreadCount={unreadCount} />
    </PageShell>
  );
}
