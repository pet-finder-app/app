"use client";

import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  clampTransform,
  scaleTransformAroundPoint,
} from "./photo-viewer-gestures";
import styles from "./photo-viewer.module.css";

type PhotoViewerProps = {
  photos: { url: string; alt: string }[];
  initialIndex: number;
  onClose: () => void;
};

type Point = { x: number; y: number };
type Transform = Point & { scale: number };
type Gesture = {
  origin: Point;
  transform: Transform;
  distance: number;
  isPinching: boolean;
};
const INITIAL_TRANSFORM: Transform = { scale: 1, x: 0, y: 0 };

/** Mount to open a modal photo gallery with bounded zoom and touch gestures. */
export function PhotoViewer({
  photos,
  initialIndex,
  onClose,
}: PhotoViewerProps) {
  const [index, setIndex] = useState(() =>
    Math.max(0, Math.min(photos.length - 1, initialIndex)),
  );
  const [transform, setTransform] = useState(INITIAL_TRANSFORM);
  const transformRef = useRef(INITIAL_TRANSFORM);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const imageSizeRef = useRef({ width: 0, height: 0 });
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<Gesture | null>(null);
  const photo = photos[index];

  function applyTransform(next: Transform) {
    const surface = surfaceRef.current;
    if (!surface) return;
    const bounded = clampTransform(next, imageSizeRef.current, {
      width: surface.clientWidth,
      height: surface.clientHeight,
    });
    transformRef.current = bounded;
    setTransform(bounded);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    const surface = surfaceRef.current;
    if (!dialog || !surface) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    const observer = new ResizeObserver(() => {
      applyTransform(transformRef.current);
    });
    observer.observe(surface);
    return () => {
      observer.disconnect();
      dialog.close();
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);

  function navigate(offset: number) {
    const next = Math.max(0, Math.min(photos.length - 1, index + offset));
    if (next === index) return;
    pointersRef.current.clear();
    gestureRef.current = null;
    imageSizeRef.current = { width: 0, height: 0 };
    applyTransform(INITIAL_TRANSFORM);
    setIndex(next);
  }

  function zoom(scale: number) {
    const current = transformRef.current;
    const boundedScale = Math.max(1, Math.min(5, scale));
    applyTransform({
      scale: boundedScale,
      x: (current.x * boundedScale) / current.scale,
      y: (current.y * boundedScale) / current.scale,
    });
  }

  function startGesture() {
    const points = Array.from(pointersRef.current.values());
    const first = points[0];
    if (!first) {
      gestureRef.current = null;
      return;
    }
    const second = points[1];
    gestureRef.current = {
      origin: second
        ? { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
        : first,
      distance: second ? Math.hypot(second.x - first.x, second.y - first.y) : 0,
      transform: { ...transformRef.current },
      isPinching: Boolean(second),
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    startGesture();
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const gesture = gestureRef.current;
    if (!gesture) return;
    const points = Array.from(pointersRef.current.values());
    const first = points[0];
    if (!first) return;
    const second = points[1];
    const origin = second
      ? { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
      : first;
    let scale = gesture.transform.scale;
    if (second && gesture.distance > 0)
      scale = Math.max(
        1,
        Math.min(
          5,
          (scale * Math.hypot(second.x - first.x, second.y - first.y)) /
            gesture.distance,
        ),
      );
    const rect = event.currentTarget.getBoundingClientRect();
    applyTransform(
      scaleTransformAroundPoint(
        gesture.transform,
        gesture.origin,
        origin,
        { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        scale,
      ),
    );
  }

  function handlePointerEnd(
    event: PointerEvent<HTMLDivElement>,
    isCanceled = false,
  ) {
    const gesture = gestureRef.current;
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.delete(event.pointerId);
    if (
      !isCanceled &&
      gesture &&
      !gesture.isPinching &&
      pointersRef.current.size === 0 &&
      gesture.transform.scale === 1 &&
      transformRef.current.scale === 1
    ) {
      const dx = event.clientX - gesture.origin.x;
      const dy = event.clientY - gesture.origin.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
        navigate(dx < 0 ? 1 : -1);
    }
    // Remaining fingers can pan after pinching, but cannot trigger a swipe.
    const wasPinching = gesture?.isPinching ?? false;
    startGesture();
    if (wasPinching && gestureRef.current) gestureRef.current.isPinching = true;
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Visualizador de fotos"
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <header className={styles.header}>
        <p role="status" aria-live="polite">
          Foto {index + 1} de {photos.length}
        </p>
        <button
          type="button"
          className={styles.control}
          aria-label="Fechar fotos"
          onClick={() => dialogRef.current?.close()}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div
        ref={surfaceRef}
        className={styles.surface}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => handlePointerEnd(event)}
        onPointerCancel={(event) => handlePointerEnd(event, true)}
        onLostPointerCapture={(event) => handlePointerEnd(event, true)}
      >
        {photo ? (
          <div
            className={styles.image}
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
          >
            <Image
              key={photo.url}
              src={photo.url}
              alt={photo.alt}
              fill
              unoptimized
              draggable={false}
              sizes="100vw"
              className="object-contain"
              onLoad={(event) => {
                imageSizeRef.current = {
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                };
                applyTransform(transformRef.current);
              }}
            />
          </div>
        ) : null}
      </div>
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.control}
          disabled={index <= 0}
          aria-label="Foto anterior"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <div className={styles.zoom}>
          <button
            type="button"
            className={styles.control}
            disabled={transform.scale <= 1}
            aria-label="Diminuir zoom"
            onClick={() => zoom(transform.scale - 0.5)}
          >
            <Minus aria-hidden="true" />
          </button>
          <span className={styles.scale}>
            {Math.round(transform.scale * 100)}%
          </span>
          <button
            type="button"
            className={styles.control}
            disabled={transform.scale >= 5}
            aria-label="Aumentar zoom"
            onClick={() => zoom(transform.scale + 0.5)}
          >
            <Plus aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.control}
            disabled={transform.scale === 1}
            aria-label="Restaurar zoom"
            onClick={() => applyTransform(INITIAL_TRANSFORM)}
          >
            <RotateCcw aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          className={styles.control}
          disabled={index >= photos.length - 1}
          aria-label="Próxima foto"
          onClick={() => navigate(1)}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </footer>
    </dialog>
  );
}
