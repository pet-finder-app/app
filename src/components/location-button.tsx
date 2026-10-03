"use client";

import { Button, iconSize } from "@/components/ui";
import { Crosshair, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Pede a localização do navegador (com autorização do adotante) para mostrar
 * os pets mais perto. Sem permissão, o CEP do perfil continua valendo.
 */
export function LocationButton({ active }: { active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(body: { lat: number; lon: number }) {
    await fetch("/api/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  function request() {
    setMessage(null);
    if (!("geolocation" in navigator)) {
      setMessage("Seu navegador não permite usar a localização.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void save({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }).finally(() => setLoading(false));
      },
      () => {
        setLoading(false);
        setMessage(
          "Não foi possível pegar sua localização. Você pode informar o CEP no perfil.",
        );
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  }

  async function clear() {
    setLoading(true);
    await fetch("/api/location", { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-1">
      {active ? (
        <Button
          type="button"
          variant="pill"
          size="sm"
          className="self-start"
          loading={loading}
          onClick={() => void clear()}
        >
          <X className={iconSize.sm} aria-hidden="true" />
          Parar de usar minha localização
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="self-start"
          loading={loading}
          loadingLabel="LOCALIZANDO..."
          onClick={request}
        >
          <Crosshair className={iconSize.sm} aria-hidden="true" />
          Usar minha localização
        </Button>
      )}
      {message ? (
        <p role="status" className="text-xs text-neutral-900">
          {message}
        </p>
      ) : null}
    </div>
  );
}
