"use client";

import { NgoPostHeader } from "@/components/ngo/ngo-post-header";
import { cn, TextLink } from "@/components/ui";
import { apiMutations } from "@/lib/api/mutations";
import { PET_STATUS_LABEL, type Pet } from "@/lib/pet";
import type { Post } from "@/lib/post";
import { useMutation } from "@tanstack/react-query";
import { ChevronRight, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FeedPostMenu } from "./feed-post-menu";
import styles from "./feed-post.module.css";
import { PostMediaCarousel, type CarouselMedia } from "./post-media-carousel";

export type FeedPostItem = {
  organizationId?: string | null;
  id: string;
  post: Post | null;
  pet:
    | (Pick<Pet, "id" | "name" | "description" | "status"> & {
        photos: { url: string }[];
      })
    | null;
  ngo: { name: string; nickname: string; logoUrl: string | null };
  liked: boolean;
  isHidden: boolean;
};

type FeedPostProps = {
  item: FeedPostItem;
  isHidden: boolean;
  onHiddenChange?: (petId: string, isHidden: boolean) => void;
  showPetStatus?: boolean;
};

export function FeedPost({
  item,
  isHidden,
  onHiddenChange,
  showPetStatus = false,
}: FeedPostProps) {
  const { post, pet, ngo } = item;
  const router = useRouter();
  const likeMutation = useMutation(apiMutations.like());
  const isLiked = item.liked;
  const isLiking = likeMutation.isPending;
  const [likeAnimation, setLikeAnimation] = useState(0);
  const likeRequestPending = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const media: CarouselMedia[] =
    post?.media ??
    pet?.photos.flatMap((photo) =>
      photo.url ? [{ url: photo.url, type: "image" as const }] : [],
    ) ??
    [];
  const targetId = post?.id ?? pet?.id;
  if (!targetId) return null;

  async function handleLike(onlyLike = false) {
    if (!targetId || likeRequestPending.current) return;
    likeRequestPending.current = true;

    setError(null);
    try {
      const data = await likeMutation.mutateAsync({
        type: pet ? "pet" : "post",
        id: pet?.id ?? targetId,
        onlyLike,
      });
      if (data.liked) setLikeAnimation((animation) => animation + 1);
      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar sua curtida. Tente novamente.",
      );
    } finally {
      likeRequestPending.current = false;
    }
  }

  return (
    <li data-feed-item={item.id} className="min-w-0 bg-white pb-3 text-text">
      <article
        tabIndex={-1}
        className="focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-tertiary"
        aria-label={
          pet ? `Publicação sobre ${pet.name}` : `Publicação de ${ngo.name}`
        }
      >
        <NgoPostHeader
          compact
          name={ngo.name}
          nickname={ngo.nickname}
          logoUrl={ngo.logoUrl}
          action={
            <FeedPostMenu
              targetType={post ? "post" : "pet"}
              targetId={targetId}
              petId={pet?.id ?? null}
              isHidden={isHidden}
              onHiddenChange={onHiddenChange ?? (() => router.refresh())}
            />
          }
        />
        {media.length ? (
          <PostMediaCarousel
            post={{ media, tagPos: post?.tagPos }}
            petName={pet?.name ?? null}
            tone="bg-secondary"
            edgeToEdge
            showTag={false}
            onPhotoDoubleTap={() => void handleLike(true)}
          />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-secondary text-sm">
            Foto indisponível
          </div>
        )}
        <div className="flex items-center justify-between gap-3 px-4">
          <button
            type="button"
            aria-label={`${isLiked ? "Nos favoritos:" : "Curtir"} ${pet?.name ?? "publicação"}`}
            aria-pressed={isLiked}
            disabled={isLiking || isLiked}
            onClick={() => void handleLike()}
            className={cn(
              "-ml-2.5 flex size-11 shrink-0 items-center justify-center overflow-visible rounded-full hover:bg-secondary focus-visible:outline-2 focus-visible:outline-accent-tertiary disabled:opacity-60 motion-safe:transition-transform motion-safe:active:scale-90",
              isLiked ? "text-red-600" : "text-text",
            )}
          >
            <Heart
              key={likeAnimation}
              className={cn(
                "size-6",
                isLiked && likeAnimation > 0 && styles.likePop,
              )}
              fill={isLiked ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
          {pet ? (
            <TextLink
              href={`/pets/${pet.id}`}
              tone="brutal"
              className="inline-flex min-h-11 items-center gap-1 text-sm no-underline hover:underline"
            >
              Mais detalhes
              <ChevronRight
                className="size-4"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </TextLink>
          ) : null}
        </div>
        {showPetStatus && pet && pet.status !== "available" ? (
          <p className="px-4 pb-2 text-sm font-medium text-neutral-600">
            {PET_STATUS_LABEL[pet.status]}
          </p>
        ) : null}
        <p className="px-4 text-sm leading-relaxed whitespace-pre-line">
          <span className="font-bold">
            {ngo.nickname ? `@${ngo.nickname}` : ngo.name}
          </span>{" "}
          {post?.caption || (pet ? `${pet.name} · ${pet.description}` : "")}
        </p>
        {error ? (
          <p role="alert" className="px-4 pt-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </article>
    </li>
  );
}
