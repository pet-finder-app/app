import { PawIcon } from "@/components/brand/paw-icon";
import { PetfinderMark } from "@/components/brand/petfinder-mark";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  /** Accessible section heading; the wordmark is the page h1. */
  heading: string;
  children: ReactNode;
  footer: ReactNode;
  /** Vivid mode uses the primary background and stacked logo. Pastel mode adds a patterned background and animated illustration. */
  background?: "vivid" | "pastel";
};

/** Bottom-aligned authentication form with the brand above. Fields and links use the primary tone. */
export function AuthLayout({
  heading,
  children,
  footer,
  background = "vivid",
}: AuthLayoutProps) {
  const isPastel = background === "pastel";
  const patternMask = [
    "linear-gradient(to bottom, transparent 14%, #000 26%, #000 44%, transparent 62%)",
    "radial-gradient(circle 150px at 50% 38%, transparent 70%, #000 100%)",
  ].join(", ");

  return (
    <main
      className={`relative isolate flex min-h-dvh flex-col overflow-hidden px-4 pt-[5dvh] pb-6 ${
        isPastel
          ? "bg-[color-mix(in_oklab,var(--color-lime-200),var(--color-lime-300))]"
          : "bg-primary"
      }`}
    >
      {isPastel ? (
        <>
          {/* Fade the watermark near the center to keep the illustration clear. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-20"
            style={{
              backgroundImage: "url('/logo-scatter.svg')",
              backgroundSize: "360px 360px",
              backgroundRepeat: "repeat",
              maskImage: patternMask,
              maskComposite: "intersect",
              WebkitMaskImage: patternMask,
              WebkitMaskComposite: "source-in",
            }}
          />
          {/* Organic decorative shapes in the corners. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 200 200"
            className="pointer-events-none absolute -top-32 -left-28 -z-10 size-56 text-primary"
          >
            <path
              fill="currentColor"
              d="M38 8c36-14 86-6 114 24s14 62-12 82-34 56-70 58S6 150 8 106 2 22 38 8Z"
            />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 200 200"
            className="pointer-events-none absolute -right-16 -bottom-24 -z-10 size-52 text-lime-100"
          >
            <path
              fill="currentColor"
              d="M60 14c40-18 96 8 112 52s-6 64 6 92-34 44-76 40S10 170 14 120 20 30 60 14Z"
            />
          </svg>
        </>
      ) : null}

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <h1
          aria-label="Petfinder"
          className="rise-in flex flex-col items-center gap-1.5 text-neutral-900"
        >
          {isPastel ? null : <PetfinderMark className="size-16" />}
          {isPastel ? (
            <>
              <span className="font-brand text-5xl leading-none drop-shadow-[1px_2px_0_var(--color-lime-600)]">
                PETFINDER.
              </span>
              <span
                aria-hidden="true"
                className="text-sm font-bold tracking-wide text-neutral-900/80"
              >
                Cada pet merece uma família.
              </span>
            </>
          ) : (
            <span className="font-brand text-4xl leading-none font-black">
              PET<span className="font-light text-white italic">FINDER.</span>
            </span>
          )}
        </h1>

        {isPastel ? (
          <div
            aria-hidden="true"
            className="flex flex-1 items-center justify-center py-4"
          >
            <div className="auth-stamp relative grid size-56 place-items-center">
              <div className="auth-halo absolute inset-0 rounded-full bg-white/40" />
              <div className="absolute -inset-2 rounded-full border-2 border-dashed border-lime-800/30" />
              <PetfinderMark
                className="auth-float relative size-44 text-lime-900"
                contentClassName="auth-paw-pulse"
              />
              <PawIcon className="auth-hop absolute -top-1 right-1 size-5 -rotate-12 text-lime-800" />
              <PawIcon className="auth-hop absolute bottom-3 left-0 size-4 rotate-[18deg] text-lime-800/70 [animation-delay:1.2s]" />
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <h2 className="sr-only">{heading}</h2>

        <div
          className={isPastel ? "rise-in" : undefined}
          style={isPastel ? { animationDelay: "120ms" } : undefined}
        >
          {children}
        </div>

        <div
          className={`mt-5 text-center text-xs font-semibold text-neutral-900 ${
            isPastel ? "rise-in flex flex-col items-center" : ""
          }`}
          style={isPastel ? { animationDelay: "200ms" } : undefined}
        >
          {footer}
        </div>
      </div>
    </main>
  );
}
