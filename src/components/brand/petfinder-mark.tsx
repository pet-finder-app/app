import type { SVGProps } from "react";

type PetfinderMarkProps = SVGProps<SVGSVGElement> & {
  /** Class applied only to the magnifier outline and handle group. */
  glassClassName?: string;
  /** Class applied only to the paw and lens-detail group. */
  contentClassName?: string;
};

/** Petfinder magnifier-and-paw mark. Keep the lens centered at viewBox coordinates (50, 50), which loading animations use as their transform origin. Separate groups allow independent animation. */
export function PetfinderMark({
  glassClassName,
  contentClassName,
  ...props
}: PetfinderMarkProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <g className={glassClassName} stroke="currentColor" strokeLinecap="round">
        {/* Short handle with rounded ends. */}
        <line x1="70" y1="70" x2="86" y2="86" strokeWidth="9" fill="none" />
        {/* Thick outline and translucent lens. */}
        <circle
          cx="50"
          cy="50"
          r="24"
          strokeWidth="8"
          fill="white"
          fillOpacity="0.28"
        />
        {/* Lens reflection: a broad arc and a small highlight. */}
        <circle
          cx="57"
          cy="37"
          r="1.6"
          fill="white"
          stroke="none"
          opacity="0.9"
        />
        <path
          d="M35 46a16 16 0 0 1 11-12"
          fill="none"
          stroke="white"
          strokeWidth="3"
          opacity="0.95"
        />
        {/* Subtle reflection on the opposite side of the lens. */}
        <path
          d="M65 56a16 16 0 0 1-8 9"
          fill="none"
          stroke="white"
          strokeWidth="2"
          opacity="0.6"
        />
      </g>
      <g className={contentClassName} fill="currentColor" stroke="none">
        {/* Bold paw centered inside the lens. */}
        <ellipse cx="50" cy="57" rx="7" ry="5.75" />
        <ellipse
          cx="40"
          cy="49"
          rx="3.25"
          ry="4.25"
          transform="rotate(-22 40 49)"
        />
        <ellipse
          cx="46"
          cy="42.5"
          rx="3.25"
          ry="4.5"
          transform="rotate(-8 46 42.5)"
        />
        <ellipse
          cx="54"
          cy="42.5"
          rx="3.25"
          ry="4.5"
          transform="rotate(8 54 42.5)"
        />
        <ellipse
          cx="60"
          cy="49"
          rx="3.25"
          ry="4.25"
          transform="rotate(22 60 49)"
        />
      </g>
    </svg>
  );
}
