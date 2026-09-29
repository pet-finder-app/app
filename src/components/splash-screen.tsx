import { PawIcon } from "./paw-icon";
import { PetfinderMark } from "./petfinder-mark";

// As cinco paradas do trajeto — como o Mapa do Maroto, cada pegada "carimba"
// o chão sozinha (o gato é invisível) e a lupa vai atrás, investigando uma
// de cada vez, até chegar ao centro da tela (onde a última pegada "sobe"
// para dentro da lente). As posições aqui precisam bater com os
// deslocamentos usados em .splash-glass-chase, em globals.css.
const TRAIL = [
  {
    top: "82%",
    left: "12%",
    rotate: "-14deg",
    pawClass: "splash-paw-1",
  },
  {
    top: "74%",
    left: "22%",
    rotate: "10deg",
    pawClass: "splash-paw-2",
  },
  {
    top: "64%",
    left: "30%",
    rotate: "-8deg",
    pawClass: "splash-paw-3",
  },
  {
    top: "56%",
    left: "40%",
    rotate: "6deg",
    pawClass: "splash-paw-4",
  },
  {
    top: "50%",
    left: "50%",
    rotate: "0deg",
    pawClass: "splash-paw-5",
  },
];

/**
 * Tela de carregamento exibida quando o app abre: como no Mapa do Maroto,
 * pegadas vão "carimbando" o chão sozinhas — um gato invisível passou por
 * ali — e a lupa as segue devagar, uma de cada vez, como um detetive
 * investigando rastros, até a última, onde a pegada some do chão e surge
 * dentro da lente, formando a marca completa.
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
      className="splash-overlay fixed inset-0 z-50 flex items-center justify-center bg-primary"
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
