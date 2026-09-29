import type { SVGProps } from "react";

type PetfinderMarkProps = SVGProps<SVGSVGElement> & {
  /** Classe aplicada só ao grupo da lupa (aro + cabo). */
  glassClassName?: string;
  /** Classe aplicada só ao grupo de dentro da lente (pegada + detalhes). */
  contentClassName?: string;
};

/**
 * Lupa com pegada — a marca do Petfinder, em estilo retrô: aro duplo (como
 * a armação de latão de uma lupa antiga) e cabo curto com ponteira
 * arredondada, no lugar de um cabo comprido e reto. A pegada fica
 * centralizada exatamente no meio da lente.
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
      <g className={contentClassName} fill="currentColor" stroke="none">
        {/* Almofada central — menor que o aro interno, com folga ao redor */}
        <ellipse cx="50" cy="57" rx="6.5" ry="5.5" />
        {/* Dedos, em leque, centralizados no mesmo eixo da almofada */}
        <ellipse
          cx="39"
          cy="48"
          rx="3.5"
          ry="4.5"
          transform="rotate(-20 39 48)"
        />
        <ellipse
          cx="46"
          cy="42"
          rx="3.5"
          ry="4.5"
          transform="rotate(-8 46 42)"
        />
        <ellipse
          cx="54"
          cy="42"
          rx="3.5"
          ry="4.5"
          transform="rotate(8 54 42)"
        />
        <ellipse
          cx="61"
          cy="48"
          rx="3.5"
          ry="4.5"
          transform="rotate(20 61 48)"
        />
      </g>
      <g
        className={glassClassName}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      >
        {/* Aro externo, grosso — a armação da lupa */}
        <circle cx="50" cy="50" r="25" strokeWidth="7" />
        {/* Aro interno, fino — o friso retrô do vidro encaixado na armação */}
        <circle cx="50" cy="50" r="20" strokeWidth="2" />
        {/* Cabo curto e a ponteira arredondada, como o de uma lupa antiga */}
        <line x1="68" y1="68" x2="82" y2="82" strokeWidth="7" />
        <circle cx="86" cy="86" r="5" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
