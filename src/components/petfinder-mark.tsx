import type { SVGProps } from "react";

type PetfinderMarkProps = SVGProps<SVGSVGElement> & {
  /** Classe aplicada só ao grupo da lupa (aro + cabo). */
  glassClassName?: string;
  /** Classe aplicada só ao grupo de dentro da lente (pegada + detalhes). */
  contentClassName?: string;
};

/**
 * Lupa com pegada — a marca do Petfinder: aro grosso, lente de vidro translúcida,
 * pegada cheia e cabo curto de ponta arredondada (formas chapadas, que
 * continuam legíveis em tamanho grande). Mesmo desenho da ilustração do
 * login.
 *
 * A lente fica no centro do próprio viewBox (50,50) — de propósito: o
 * elemento é centralizado na tela pelo seu centro geométrico, então se a
 * lente não estivesse exatamente em (50,50) ela apareceria deslocada do
 * ponto onde o resto do app espera que a lupa esteja (ex.: em cima de uma
 * pegada, na animação de carregamento). `transform-origin` em globals.css
 * (`.splash-glass-chase`, `.splash-mark-content`) precisa continuar
 * apontando para "50px 50px" se essas coordenadas mudarem.
 *
 * Separada em dois grupos (lupa e conteúdo da lente) para a tela de
 * carregamento poder animar um depois do outro; usada sozinha, os dois
 * grupos aparecem juntos normalmente.
 */
export function PetfinderMark({
  glassClassName,
  contentClassName,
  ...props
}: PetfinderMarkProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <g className={glassClassName} stroke="currentColor" strokeLinecap="round">
        {/* Cabo curto com ponta arredondada */}
        <line x1="70" y1="70" x2="86" y2="86" strokeWidth="9" fill="none" />
        {/* Aro grosso e lente de vidro translúcida (deixa ver o que está atrás) */}
        <circle
          cx="50"
          cy="50"
          r="24"
          strokeWidth="8"
          fill="white"
          fillOpacity="0.28"
        />
        {/* Reflexo do vidro: arco grande e um pontinho */}
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
        {/* Reflexo fraco no lado oposto, como luz batendo no vidro */}
        <path
          d="M65 56a16 16 0 0 1-8 9"
          fill="none"
          stroke="white"
          strokeWidth="2"
          opacity="0.6"
        />
      </g>
      <g className={contentClassName} fill="currentColor" stroke="none">
        {/* Pegada grossa, centralizada na lente */}
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
