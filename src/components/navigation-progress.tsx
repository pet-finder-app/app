"use client";

import { PetfinderMark } from "@/components/petfinder-mark";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Feedback imediato de navegação: ao tocar num link interno, mostra a lupa
 * do login "procurando" até a próxima tela abrir. Sem isso, o toque parece
 * não ter feito nada enquanto a página carrega.
 *
 * "Carregando" = a rota em que a pessoa tocou ainda é a atual; quando a
 * rota (caminho + query) muda, o indicador some sozinho.
 */
export function NavigationProgress() {
  const route = `${usePathname()}?${useSearchParams().toString()}`;
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const anchor = (event.target as Element).closest("a");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}?${url.searchParams.toString()}`;
      if (
        next ===
        `${window.location.pathname}?${window.location.search.slice(1)}`
      )
        return;
      setPendingFrom(
        `${window.location.pathname}?${window.location.search.slice(1)}`,
      );
    }
    // Captura: o <Link> do Next chama preventDefault na fase normal, e aí o
    // clique pareceria "já tratado" para quem escuta depois dele.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Rede de segurança: nunca deixa o indicador preso.
  useEffect(() => {
    if (pendingFrom === null) return;
    const timeout = setTimeout(() => setPendingFrom(null), 10000);
    return () => clearTimeout(timeout);
  }, [pendingFrom]);

  if (pendingFrom === null || pendingFrom !== route) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-900 shadow-lg"
    >
      <PetfinderMark className="lupa-loading size-7 text-neutral-900" />
      Carregando...
    </div>
  );
}
