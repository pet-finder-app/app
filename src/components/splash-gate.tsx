"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SplashScreen } from "./splash-screen";

// Precisam bater com os tempos definidos em globals.css (.splash-overlay).
const FULL_DURATION_MS = 5300;
// Recarregar a página: versão curta (ver .splash-quick em globals.css).
const QUICK_DURATION_MS = 2000;
const REDUCED_MOTION_DURATION_MS = 550;

type SplashGateProps = {
  children: ReactNode;
};

/**
 * Mostra a tela de carregamento por alguns instantes quando o app é aberto
 * e depois some, revelando o conteúdo. Sendo um componente client, o React
 * já o renderiza visível no HTML inicial — não há flash de tela branca
 * antes da animação começar.
 *
 * Como o layout persiste entre navegações do lado do cliente, isso só
 * acontece na primeira carga da página, não a cada troca de rota.
 */
export function SplashGate({ children }: SplashGateProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [quick, setQuick] = useState(false);

  useEffect(() => {
    // A animação longa (5s) só roda na primeira abertura da sessão; nos
    // recarregamentos roda a versão curta (2s). A marca só é gravada ao
    // fim do tempo: o React em modo dev executa este efeito duas vezes, e
    // gravar antes faria a segunda execução achar que já foi vista.
    let seen = false;
    try {
      seen = sessionStorage.getItem("splash-seen") === "1";
    } catch {
      // sessionStorage indisponível: segue com a animação normal.
    }
    const quickTimeout = setTimeout(() => setQuick(seen), 0);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const timeout = setTimeout(
      () => {
        try {
          sessionStorage.setItem("splash-seen", "1");
        } catch {}
        setShowSplash(false);
      },
      prefersReducedMotion
        ? REDUCED_MOTION_DURATION_MS
        : seen
          ? QUICK_DURATION_MS
          : FULL_DURATION_MS,
    );

    return () => {
      clearTimeout(quickTimeout);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      {showSplash ? <SplashScreen quick={quick} /> : null}
      {/* `inert` tira o conteúdo de trás do foco e da árvore de
          acessibilidade enquanto a tela de carregamento cobre a tela;
          `contents` faz o wrapper não interferir no layout da página. */}
      <div className="contents" inert={showSplash}>
        {children}
      </div>
    </>
  );
}
