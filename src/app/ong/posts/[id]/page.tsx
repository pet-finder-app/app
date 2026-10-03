import { BrutalLinkButton } from "@/components/brutal-button";
import { OngPostCard } from "@/components/ong-post-card";
import { OngTabBar } from "@/components/ong-tab-bar";
import { iconSize, PageShell } from "@/components/ui";
import {
  countNotificationsByPet,
  listNotificationsByOng,
} from "@/lib/notifications";
import { getPetByIdAndOng } from "@/lib/pets";
import { getPostByIdAndOng } from "@/lib/posts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Post – Petfinder",
};

/** Um post do perfil aberto sozinho (ao tocar na foto da grade). */
export default async function OngPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const post = await getPostByIdAndOng(id, user.id);
  if (!post) notFound();

  const [pet, notifications] = await Promise.all([
    post.petId ? getPetByIdAndOng(post.petId, user.id) : undefined,
    listNotificationsByOng(user.id),
  ]);
  const unreadCount = notifications.filter((n) => n.readAt === null).length;
  const likesByPet = countNotificationsByPet(notifications, "curtida");
  const interestedByPet = countNotificationsByPet(notifications, "interesse");
  const ong = user.ong;

  return (
    <PageShell hasActionBar>
      <BrutalLinkButton
        href="/"
        variant="pill"
        size="sm"
        className="self-start"
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Perfil
      </BrutalLinkButton>

      <ul className="flex flex-col">
        <OngPostCard
          post={post}
          pet={pet ?? null}
          tone="bg-yellow-200"
          ongName={ong.legal.tradeName}
          ongNickname={ong.legal.nickname}
          ongLogoUrl={ong.publicProfile.logo?.url ?? null}
          likesCount={pet ? (likesByPet[pet.id] ?? 0) : 0}
          interestedCount={pet ? (interestedByPet[pet.id] ?? 0) : 0}
          redirectTo="/"
        />
      </ul>

      <BrutalLinkButton href={`/ong/posts/${post.id}/editar`} size="md">
        <Pencil className={iconSize.md} aria-hidden="true" />
        Editar post
      </BrutalLinkButton>

      <OngTabBar unreadCount={unreadCount} />
    </PageShell>
  );
}
