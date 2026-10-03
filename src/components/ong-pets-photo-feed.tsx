"use client";

import { BrutalLinkButton } from "@/components/brutal-button";
import { BrutalCard } from "@/components/brutal-card";
import { OngPostCard } from "@/components/ong-post-card";
import { PawIcon } from "@/components/paw-icon";
import { cn, iconSize } from "@/components/ui";
import type { Pet } from "@/lib/pet";
import type { Post } from "@/lib/post";
import { Images, LayoutGrid, List, Play, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type View = "grid" | "list";

/** Pastel, mas mais vivo que os tokens do resto do app — só para o balão do nome. */
const BUBBLE_TONE = [
  "bg-yellow-200",
  "bg-emerald-200",
  "bg-orange-200",
  "bg-purple-200",
];

/** Miniatura do post na grade; toque abre o post. */
function PostCell({ post, petName }: { post: Post; petName: string | null }) {
  const cover = post.media[0];
  const label = petName ? `Abrir post de ${petName}` : "Abrir post";

  return (
    <Link
      href={`/ong/posts/${post.id}`}
      aria-label={label}
      className="relative aspect-square overflow-hidden rounded-lg border border-neutral-900 bg-white/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      {cover?.type === "video" ? (
        <video
          src={cover.url}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="size-full object-cover"
        />
      ) : cover ? (
        <Image
          src={cover.url}
          alt=""
          fill
          sizes="(max-width: 640px) 33vw, 200px"
          className="object-cover"
        />
      ) : (
        <PawIcon className="absolute inset-0 m-auto size-6 text-neutral-900/30" />
      )}
      {post.media.length > 1 ? (
        <Images
          className="absolute top-1.5 right-1.5 size-4 text-white drop-shadow"
          aria-hidden="true"
        />
      ) : cover?.type === "video" ? (
        <Play
          className="absolute top-1.5 right-1.5 size-4 text-white drop-shadow"
          fill="currentColor"
          aria-hidden="true"
        />
      ) : null}
    </Link>
  );
}

/** Feed de fotos dos pets no Perfil, com alternância grade/lista (estilo Instagram). */
export function OngPetsPhotoFeed({
  posts,
  pets,
  ongName,
  ongNickname,
  ongLogoUrl,
  likesByPet,
  interestedByPet,
}: {
  posts: Post[];
  pets: Pet[];
  ongName: string;
  ongNickname: string;
  ongLogoUrl: string | null;
  likesByPet: Record<string, number>;
  interestedByPet: Record<string, number>;
}) {
  const [view, setView] = useState<View>("grid");
  const petById = new Map(pets.map((pet) => [pet.id, pet]));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-neutral-600">
          <PawIcon className={iconSize.md} aria-hidden="true" />
          <span className="text-xs font-bold tracking-wide uppercase">
            Fotos dos pets
          </span>
        </div>

        <div className="flex items-center gap-1">
          <BrutalLinkButton href="/ong/posts/novo" size="sm">
            <Plus className={iconSize.md} aria-hidden="true" />
            Novo post
          </BrutalLinkButton>
          <div
            role="group"
            aria-label="Modo de visualização"
            className="flex items-center gap-1"
          >
            <button
              type="button"
              aria-label="Ver em grade"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={cn(
                "flex size-8 items-center justify-center rounded-full",
                view === "grid"
                  ? "text-neutral-900"
                  : "text-gray-400 hover:text-neutral-600",
              )}
            >
              <LayoutGrid
                className={iconSize.md}
                strokeWidth={view === "grid" ? 2.75 : 2}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              aria-label="Ver em lista"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={cn(
                "flex size-8 items-center justify-center rounded-full",
                view === "list"
                  ? "text-neutral-900"
                  : "text-gray-400 hover:text-neutral-600",
              )}
            >
              <List
                className={iconSize.md}
                strokeWidth={view === "list" ? 2.75 : 2}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      {posts.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <PostCell
                key={post.id}
                post={post}
                petName={petById.get(post.petId ?? "")?.name ?? null}
              />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {posts.map((post, index) => {
              const pet = petById.get(post.petId ?? "") ?? null;
              return (
                <OngPostCard
                  key={post.id}
                  post={post}
                  pet={pet}
                  tone={BUBBLE_TONE[index % BUBBLE_TONE.length]}
                  ongName={ongName}
                  ongNickname={ongNickname}
                  ongLogoUrl={ongLogoUrl}
                  likesCount={pet ? (likesByPet[pet.id] ?? 0) : 0}
                  interestedCount={pet ? (interestedByPet[pet.id] ?? 0) : 0}
                />
              );
            })}
          </ul>
        )
      ) : (
        <BrutalCard className="items-center gap-3 text-center">
          <p className="text-sm text-neutral-600">
            Você ainda não publicou nenhum post.
          </p>
          <BrutalLinkButton href="/ong/posts/novo" size="md">
            Criar primeiro post
          </BrutalLinkButton>
        </BrutalCard>
      )}
    </div>
  );
}
