import type { SVGProps } from "react";

type PetfinderMarkProps = SVGProps<SVGSVGElement> & {
  /** Classe aplicada só ao grupo da lupa (aro + cabo). */
  glassClassName?: string;
  /** Classe aplicada só ao grupo de dentro da lente (pegada + detalhes). */
  contentClassName?: string;
};

/**
 * Lupa com pegada — a marca do Petfinder. Separada em dois grupos (lupa e
 * conteúdo da lente) para a tela de carregamento poder animar um depois do
 * outro; usada sozinha, os dois grupos aparecem juntos normalmente.
 */
export function PetfinderMark({
  glassClassName,
  contentClassName,
  ...props
}: PetfinderMarkProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <g className={contentClassName} fill="currentColor" stroke="none">
        <ellipse cx="40" cy="49" rx="8.5" ry="7" />
        <ellipse
          cx="27"
          cy="36"
          rx="4.6"
          ry="6"
          transform="rotate(-16 27 36)"
        />
        <ellipse cx="35" cy="27" rx="4.6" ry="6" transform="rotate(-5 35 27)" />
        <ellipse cx="45" cy="27" rx="4.6" ry="6" transform="rotate(5 45 27)" />
        <ellipse cx="53" cy="36" rx="4.6" ry="6" transform="rotate(16 53 36)" />
        <circle cx="57" cy="20" r="2.4" />
        <circle cx="63" cy="27" r="1.7" />
      </g>
      <g
        className={glassClassName}
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      >
        <circle cx="40" cy="40" r="25" />
        <line x1="58" y1="58" x2="80" y2="80" />
      </g>
    </svg>
  );
}
