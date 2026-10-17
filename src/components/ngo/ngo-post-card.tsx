"use client";

import { PostCardMenu } from "@/components/posts/post-card-menu";
import { PostMediaCarousel } from "@/components/posts/post-media-carousel";
import { Badge, cn, shadowSoft } from "@/components/ui";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SPECIES_LABEL,
  type Pet,
} from "@/lib/pet";
import type { Post } from "@/lib/post";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { NgoPostHeader } from "./ngo-post-header";

const TAG_TONE = ["bg-green-100!", "bg-amber-100!", "bg-rose-100!"];

/** NGO post with organization header, menu, tagged-media carousel, engagement, and caption. Shared by profile and individual-post views. */
export function NgoPostCard({
  post,
  pet,
  tone,
  ngoName,
  ngoNickname,
  ngoLogoUrl,
  likesCount,
  interestedCount,
  redirectTo,
  headerAction,
  footer,
}: {
  post: Post;
  /** Tagged pet, when it still exists. */
  pet: Pet | null;
  tone: string;
  ngoName: string;
  ngoNickname: string;
  ngoLogoUrl: string | null;
  likesCount: number;
  interestedCount: number;
  /** Optional redirect after deleting the post; otherwise remain on the current page. */
  redirectTo?: string;
  /** Replace the NGO edit/delete menu with a caller-provided action. */
  headerAction?: ReactNode;
  /** Replace the NGO engagement bar with caller-provided actions. */
  footer?: ReactNode;
}) {
  const tags = pet
    ? [
        PET_SPECIES_LABEL[pet.species],
        pet.breed,
        PET_AGE_GROUP_LABEL[pet.ageGroup],
        PET_SEX_LABEL[pet.sex],
      ].filter(Boolean)
    : [];

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-3xl bg-white pb-3",
        shadowSoft.md,
      )}
    >
      <NgoPostHeader
        name={ngoName}
        nickname={ngoNickname}
        logoUrl={ngoLogoUrl}
        action={
          headerAction ?? (
            <PostCardMenu post={post} pet={pet} redirectTo={redirectTo} />
          )
        }
      />

      <PostMediaCarousel post={post} petName={pet?.name ?? null} tone={tone} />

      {footer ? (
        <div className="mx-2">{footer}</div>
      ) : pet ? (
        <div className="flex items-center gap-1 px-2">
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
            href={`/ngo/messages?pet=${pet.id}`}
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
              {interestedCount} adotantes interessados em adotar {pet.name} —
              ver mensagens
            </span>
          </Link>
        </div>
      ) : null}

      <p
        className={cn(
          "px-4 text-sm leading-relaxed whitespace-pre-line text-neutral-900",
        )}
      >
        <span className="font-bold">@{ngoNickname}</span> {post.caption}
      </p>

      <div className="flex flex-wrap gap-1.5 px-4">
        {tags.map((label, index) => (
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
