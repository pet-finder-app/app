"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const REFRESH_MS = 15000;

type NavigationAlerts = {
  chats: number;
  adoptions: number;
  avatarUrl: string | null;
};

/** Poll navigation counts and the profile photo, including on route changes. */
export function useAlerts(): NavigationAlerts {
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<NavigationAlerts>({
    chats: 0,
    adoptions: 0,
    avatarUrl: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/alerts");
        if (!response.ok || cancelled) return;
        const payload: unknown = await response.json();
        if (cancelled || typeof payload !== "object" || payload === null)
          return;
        if (
          !("chats" in payload) ||
          typeof payload.chats !== "number" ||
          !("adoptions" in payload) ||
          typeof payload.adoptions !== "number"
        )
          return;
        setAlerts({
          chats: payload.chats,
          adoptions: payload.adoptions,
          avatarUrl:
            "avatarUrl" in payload && typeof payload.avatarUrl === "string"
              ? payload.avatarUrl
              : null,
        });
      } catch {
        // Retry on the next polling cycle if the connection is unavailable.
      }
    }
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname]);

  return alerts;
}
