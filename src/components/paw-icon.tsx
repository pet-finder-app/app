import type { SVGProps } from "react";

/** Pegada estampada — usada na trilha animada da tela de carregamento. */
export function PawIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <ellipse cx="50" cy="66" rx="19" ry="16" />
      <ellipse cx="24" cy="42" rx="10" ry="13" transform="rotate(-18 24 42)" />
      <ellipse cx="41" cy="28" rx="10" ry="13" transform="rotate(-6 41 28)" />
      <ellipse cx="59" cy="28" rx="10" ry="13" transform="rotate(6 59 28)" />
      <ellipse cx="76" cy="42" rx="10" ry="13" transform="rotate(18 76 42)" />
    </svg>
  );
}
