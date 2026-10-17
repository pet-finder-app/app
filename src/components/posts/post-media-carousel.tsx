"use client";

import { cn, shadowSoft } from "@/components/ui";
import { DEFAULT_TAG_POS, type Post } from "@/lib/post";
import { ChevronLeft, ChevronRight, Heart, Maximize2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { PhotoViewer } from "./photo-viewer";
import styles from "./post-media-carousel.module.css";

type PostMediaCarouselProps = {
  post: Pick<Post, "media" | "tagPos">;
  edgeToEdge?: boolean;
  showTag?: boolean;
  petName: string | null;
  tone: string;
  onPhotoDoubleTap?: () => void;
  enablePhotoViewer?: boolean;
};

type PhotoTap = {
  x: number;
  y: number;
  time: number;
  url: string;
  scrollLeft: number;
  hasMoved: boolean;
};

/** Snap-scrolling post-media carousel with count and pagination dots. */
export function PostMediaCarousel({
  post,
  petName,
  tone,
  edgeToEdge = false,
  showTag = true,
  onPhotoDoubleTap,
  enablePhotoViewer = false,
}: PostMediaCarouselProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ startX: 0, startScroll: 0 });
  const currentTap = useRef<PhotoTap | null>(null);
  const previousTap = useRef<PhotoTap | null>(null);
  const [heartBurst, setHeartBurst] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const photos = post.media.flatMap((item, mediaIndex) =>
    item.type === "image"
      ? [
          {
            url: item.url,
            alt: petName
              ? `${petName}, foto ${mediaIndex + 1}`
              : `Foto ${mediaIndex + 1}`,
          },
        ]
      : [],
  );
  const total = post.media.length;
  const pos = post.tagPos ?? DEFAULT_TAG_POS;

  useEffect(() => {
    if (!heartBurst) return;
    const timer = window.setTimeout(() => setHeartBurst(0), 700);
    return () => window.clearTimeout(timer);
  }, [heartBurst]);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    if (el.clientWidth > 0)
      setIndex(
        Math.min(
          total - 1,
          Math.max(0, Math.round(el.scrollLeft / el.clientWidth)),
        ),
      );
  }

  function goTo(target: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({
      left: target * el.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  // Touch scrolls natively; mouse users drag the carousel.
  function handlePointerDown(event: PointerEvent<HTMLUListElement>) {
    const el = scrollerRef.current;
    currentTap.current = null;
    if (!event.isPrimary) previousTap.current = null;
    const photo =
      event.target instanceof Element
        ? event.target.closest("img[data-carousel-photo]")
        : null;
    const url = photo?.getAttribute("data-carousel-photo");
    if (
      (onPhotoDoubleTap || enablePhotoViewer) &&
      el &&
      event.isPrimary &&
      event.button === 0 &&
      url
    ) {
      currentTap.current = {
        x: event.clientX,
        y: event.clientY,
        time: event.timeStamp,
        url,
        scrollLeft: el.scrollLeft,
        hasMoved: false,
      };
    }
    if (!el || total < 2 || event.pointerType !== "mouse" || event.button !== 0)
      return;
    if (event.target instanceof HTMLElement && event.target.tagName === "VIDEO")
      return;
    drag.current = { startX: event.clientX, startScroll: el.scrollLeft };
    setDragging(true);
    el.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLUListElement>) {
    const tap = currentTap.current;
    if (tap && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 8) {
      tap.hasMoved = true;
      previousTap.current = null;
    }
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

  function handlePointerUp(event: PointerEvent<HTMLUListElement>) {
    const tap = currentTap.current;
    currentTap.current = null;
    const el = scrollerRef.current;
    if (
      tap &&
      el &&
      !tap.hasMoved &&
      event.timeStamp - tap.time <= 350 &&
      Math.hypot(event.clientX - tap.x, event.clientY - tap.y) <= 8 &&
      Math.abs(el.scrollLeft - tap.scrollLeft) <= 4
    ) {
      if (enablePhotoViewer) {
        const photoIndex = photos.findIndex((photo) => photo.url === tap.url);
        if (photoIndex >= 0) setViewerIndex(photoIndex);
        previousTap.current = null;
        endDrag();
        return;
      }
      const previous = previousTap.current;
      if (
        previous &&
        tap.url === previous.url &&
        event.timeStamp - previous.time <= 300 &&
        Math.hypot(tap.x - previous.x, tap.y - previous.y) <= 32
      ) {
        previousTap.current = null;
        setHeartBurst((burst) => burst + 1);
        onPhotoDoubleTap?.();
      } else {
        previousTap.current = { ...tap, time: event.timeStamp };
      }
    } else {
      previousTap.current = null;
    }
    endDrag();
  }

  function handlePointerCancel() {
    currentTap.current = null;
    previousTap.current = null;
    endDrag();
  }

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden bg-secondary",
          !edgeToEdge && "mx-2 rounded-2xl",
        )}
      >
        <ul
          ref={scrollerRef}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          aria-label={
            petName
              ? `Fotos e vídeos de ${petName}, ${total} no total`
              : `Mídias do post, ${total} no total`
          }
          className={cn(
            "flex aspect-square snap-x [scrollbar-width:none] overflow-x-auto select-none [&::-webkit-scrollbar]:hidden",
            dragging ? "snap-none" : "snap-mandatory",
            total > 1 && (dragging ? "cursor-grabbing" : "cursor-grab"),
            (onPhotoDoubleTap || enablePhotoViewer) && "touch-manipulation",
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
              ) : enablePhotoViewer ? (
                <button
                  type="button"
                  aria-label={`Ampliar foto ${i + 1}${petName ? ` de ${petName}` : ""}`}
                  aria-haspopup="dialog"
                  className="absolute inset-0 cursor-zoom-in focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-tertiary"
                  onClick={(event) => {
                    // Pointer activation is handled above so swipes never open the viewer.
                    if (event.detail === 0)
                      setViewerIndex(
                        photos.findIndex((photo) => photo.url === item.url),
                      );
                  }}
                >
                  <Image
                    src={item.url}
                    alt={
                      petName ? `${petName}, foto ${i + 1}` : `Foto ${i + 1}`
                    }
                    fill
                    draggable={false}
                    data-carousel-photo={item.url}
                    sizes="(max-width: 640px) 100vw, 500px"
                    className="object-cover"
                  />
                </button>
              ) : (
                <Image
                  src={item.url}
                  alt={petName ? `${petName}, foto ${i + 1}` : `Foto ${i + 1}`}
                  fill
                  draggable={false}
                  data-carousel-photo={item.url}
                  sizes="(max-width: 640px) 100vw, 500px"
                  className="object-cover"
                />
              )}
            </li>
          ))}
        </ul>

        {enablePhotoViewer && photos.length > 0 ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-3 left-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <Maximize2 className="size-5" />
          </span>
        ) : null}
        {heartBurst > 0 ? (
          <span
            key={heartBurst}
            aria-hidden="true"
            className={styles.heartLayer}
          >
            <Heart
              className={styles.heart}
              fill="currentColor"
              strokeWidth={1.5}
            />
          </span>
        ) : null}

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
                    i === index ? "bg-white" : "bg-white/50",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}

        {petName && showTag ? (
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
      {viewerIndex !== null ? (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </>
  );
}
