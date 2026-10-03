"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const REFRESH_MS = 15000;

/**
 * Quantas mensagens não lidas e adoções esperando a vez da pessoa, para o
 * selo do menu de baixo. Consulta de tempos em tempos e a cada troca de tela.
 */
export function useAvisos(): { chats: number; adoptions: number } {
  const pathname = usePathname();
  const [avisos, setAvisos] = useState({ chats: 0, adoptions: 0 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/avisos");
        if (!response.ok || cancelled) return;
        setAvisos((await response.json()) as typeof avisos);
      } catch {
        // Sem conexão agora: tenta de novo no próximo ciclo.
      }
    }
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname]);

  return avisos;
}
