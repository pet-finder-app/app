"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import styles from "./photo-auth-layout.module.css";

const PETS = ["tigresa", "caramelo", "nuvem", "thor", "amendoim", "mimi"];
const SLIDE_INTERVAL_MS = 10_000;
const FADE_MS = 1_500;

export function PetSlideshow() {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<string[]>([]);
  const next = (active + 1) % PETS.length;
  const nextIsReady = loaded.includes(PETS[next]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timeout: ReturnType<typeof setTimeout> | undefined;

    function schedule() {
      clearTimeout(timeout);
      if (reducedMotion.matches || document.hidden || !nextIsReady) return;

      timeout = setTimeout(() => setActive(next), SLIDE_INTERVAL_MS);
    }

    schedule();
    reducedMotion.addEventListener("change", schedule);
    document.addEventListener("visibilitychange", schedule);

    return () => {
      clearTimeout(timeout);
      reducedMotion.removeEventListener("change", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [next, nextIsReady]);

  return (
    <div
      className={styles.slideshow}
      aria-hidden="true"
      style={
        {
          "--fade-duration": `${FADE_MS}ms`,
          "--slide-duration": `${SLIDE_INTERVAL_MS + FADE_MS}ms`,
        } as CSSProperties
      }
    >
      {PETS.map((pet, index) => (
        <Image
          key={pet}
          src={`/pets/${pet}.jpg`}
          alt=""
          fill
          priority={index === 0}
          loading={index === 0 ? undefined : "eager"}
          sizes="100vw"
          className={styles.background}
          data-active={index === active}
          onLoad={() =>
            setLoaded((previous) =>
              previous.includes(pet) ? previous : [...previous, pet],
            )
          }
        />
      ))}
    </div>
  );
}
