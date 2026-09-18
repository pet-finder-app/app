"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SplashScreen } from "./splash-screen";

// Precisam bater com os tempos definidos em globals.css (.splash-overlay).
const FULL_DURATION_MS = 2970;
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

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const timeout = setTimeout(
      () => setShowSplash(false),
      prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : FULL_DURATION_MS,
    );

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {showSplash ? <SplashScreen /> : null}
      {/* `inert` tira o conteúdo de trás do foco e da árvore de
          acessibilidade enquanto a tela de carregamento cobre a tela;
          `contents` faz o wrapper não interferir no layout da página. */}
      <div className="contents" inert={showSplash}>
        {children}
      </div>
    </>
  );
}
