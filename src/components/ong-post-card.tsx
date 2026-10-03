"use client";

import { PawIcon } from "@/components/paw-icon";
import { PostCardMenu } from "@/components/post-card-menu";
import { Badge, cn, shadowSoft } from "@/components/ui";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SPECIES_LABEL,
  type Pet,
} from "@/lib/pet";
import { DEFAULT_TAG_POS, type Post } from "@/lib/post";
import { ChevronLeft, ChevronRight, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";

const TAG_TONE = ["bg-green-100!", "bg-amber-100!", "bg-rose-100!"];

/** Carrossel de fotos/vídeos do post (rolagem com snap), com contador e pontos. */
function PostMediaCarousel({
  post,
  petName,
  tone,
}: {
  post: Post;
  petName: string | null;
  tone: string;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ startX: 0, startScroll: 0 });
  const total = post.media.length;
  const pos = post.tagPos ?? DEFAULT_TAG_POS;

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(target: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  }

  // O dedo já rola o carrossel; o mouse precisa arrastar na mão.
  function handlePointerDown(event: PointerEvent<HTMLUListElement>) {
    const el = scrollerRef.current;
    if (!el || total < 2 || event.pointerType !== "mouse" || event.button !== 0)
      return;
    if ((event.target as HTMLElement).tagName === "VIDEO") return;
    drag.current = { startX: event.clientX, startScroll: el.scrollLeft };
    setDragging(true);
    el.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLUListElement>) {
    const el = scrollerRef.current;
    if (!dragging || !el) return;
    el.scrollLeft =
      drag.current.startScroll - (event.clientX - drag.current.startX);
  }

  function endDrag() {
    const el = scrollerRef.current;
    if (!dragging || !el) return;
    setDragging(false);
    goTo(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="relative mx-2 overflow-hidden rounded-2xl bg-neutral-100">
      <ul
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label={`Mídias do post, ${total} no total`}
        className={cn(
          "flex aspect-square snap-x [scrollbar-width:none] overflow-x-auto select-none [&::-webkit-scrollbar]:hidden",
          dragging ? "snap-none" : "snap-mandatory",
          total > 1 && (dragging ? "cursor-grabbing" : "cursor-grab"),
        )}
      >
        {post.media.map((item, i) => (
          <li
            key={item.url}
            className="relative size-full shrink-0 snap-center"
          >
            {item.type === "video" ? (
              <video
                src={item.url}
                controls
                playsInline
                preload="metadata"
                aria-label={`Vídeo ${i + 1} de ${total}`}
                className="size-full bg-neutral-900 object-contain"
              />
            ) : (
              <Image
                src={item.url}
                alt={petName ? `${petName}, foto ${i + 1}` : `Foto ${i + 1}`}
                fill
                draggable={false}
                sizes="(max-width: 640px) 100vw, 500px"
                className="object-cover"
              />
            )}
          </li>
        ))}
      </ul>

      {total > 1 ? (
        <>
          {index > 0 ? (
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Mídia anterior"
              className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/40 text-white hover:bg-neutral-900/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
          ) : null}
          {index < total - 1 ? (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Próxima mídia"
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/40 text-white hover:bg-neutral-900/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          ) : null}
          <span
            aria-hidden="true"
            className="absolute top-3 right-3 rounded-full bg-neutral-900/80 px-2.5 py-1 text-xs font-bold text-white"
          >
            {index + 1}/{total}
          </span>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5"
          >
            {post.media.map((item, i) => (
              <span
                key={item.url}
                className={cn(
                  "size-1.5 rounded-full",
                  i === index ? "bg-neutral-900" : "bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      ) : null}

      {petName ? (
        <span
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          <span
            className={cn(
              "relative inline-block rounded-full px-3 py-1.5 text-xs font-bold text-neutral-900",
              shadowSoft.md,
              tone,
            )}
          >
            {petName}
          </span>
        </span>
      ) : null}
    </div>
  );
}

/**
 * Post da ONG, estilo Instagram: cabeçalho com a ONG e o menu, carrossel de
 * mídias com a marcação do pet, curtidas/interessados e legenda. Usado na
 * lista do perfil e na página do post.
 */
export function OngPostCard({
  post,
  pet,
  tone,
  ongName,
  ongNickname,
  ongLogoUrl,
  likesCount,
  interestedCount,
  redirectTo,
  headerAction,
  footer,
}: {
  post: Post;
  /** Pet marcado, se ainda existir. */
  pet: Pet | null;
  tone: string;
  ongName: string;
  ongNickname: string;
  ongLogoUrl: string | null;
  likesCount: number;
  interestedCount: number;
  /** Para onde ir depois de excluir o post (padrão: continua na página). */
  redirectTo?: string;
  /** Troca o menu da ONG (editar/excluir) por outra ação, ex.: Seguir. */
  headerAction?: ReactNode;
  /** Troca a barra de curtidas/interessados da ONG (ex.: ações do adotante). */
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
      <div className="flex items-center gap-3 px-3 pt-3">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-primary-soft">
          {ongLogoUrl ? (
            <Image
              src={ongLogoUrl}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <PawIcon className="absolute inset-0 m-auto size-5 text-lime-800" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-tight font-bold text-neutral-900">
            {ongName}
          </p>
          <p className="truncate text-xs text-neutral-600">@{ongNickname}</p>
        </div>
        {headerAction ?? (
          <PostCardMenu post={post} pet={pet} redirectTo={redirectTo} />
        )}
      </div>

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
            href={`/ong/mensagens?pet=${pet.id}`}
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
        <span className="font-bold">@{ongNickname}</span> {post.caption}
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
