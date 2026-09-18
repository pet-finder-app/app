import { PawIcon } from "./paw-icon";
import { PetfinderMark } from "./petfinder-mark";

// As três paradas do trajeto — a lupa visita cada uma nessa ordem, como um
// detetive seguindo rastros, até chegar ao centro da tela (onde a pegada
// "sobe" para dentro da lente). As posições aqui precisam bater com os
// deslocamentos usados em .splash-glass-chase, em globals.css.
const TRAIL = [
  {
    top: "68%",
    left: "24%",
    rotate: "-10deg",
    pawClass: "splash-paw-1",
  },
  {
    top: "56%",
    left: "38%",
    rotate: "6deg",
    pawClass: "splash-paw-2",
  },
  {
    top: "50%",
    left: "50%",
    rotate: "0deg",
    pawClass: "splash-paw-3",
  },
];

/**
 * Tela de carregamento exibida quando o app abre: a lupa "segue" três
 * pegadas pelo chão, como um detetive investigando rastros, até chegar à
 * última — onde a pegada some do chão e surge dentro da lente, formando a
 * marca completa.
 *
 * Toda a animação é feita em CSS puro (classes `.splash-*` em globals.css)
 * para funcionar sem depender de JavaScript e para respeitar
 * `prefers-reduced-motion` automaticamente (o percurso some e a marca
 * aparece direto, já montada, sem o movimento).
 */
export function SplashScreen() {
  return (
    <div
      role="status"
      className="splash-overlay fixed inset-0 z-50 flex items-center justify-center bg-brand"
    >
      <span className="sr-only">Carregando Petfinder…</span>

      <div className="absolute inset-0" aria-hidden="true">
        {TRAIL.map((paw) => (
          <span
            key={paw.pawClass}
            className="absolute"
            style={{
              top: paw.top,
              left: paw.left,
              transform: `translate(-50%, -50%) rotate(${paw.rotate})`,
            }}
          >
            <PawIcon className={`${paw.pawClass} h-9 w-9 text-black/80`} />
          </span>
        ))}
      </div>

      {/* overflow-visible: sem isso, o <svg> recorta a lupa assim que ela
          se move para fora da sua própria caixa ao seguir as pegadas. */}
      <PetfinderMark
        className="relative h-28 w-28 overflow-visible text-black"
        glassClassName="splash-glass-chase"
        contentClassName="splash-mark-content"
      />
    </div>
  );
}
