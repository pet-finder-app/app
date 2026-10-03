"use client";

import { Button } from "@/components/ui";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Botão da ONG: abre a conversa com um interessado que ainda não escreveu. */
export function StartConversationButton({
  petId,
  adopterId,
  adopterName,
}: {
  petId: string;
  adopterId: string;
  adopterName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ong/pets/${petId}/conversar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adopterId }),
      });
      const data = (await response.json()) as {
        conversationId?: string;
        message?: string;
      };
      if (!response.ok || !data.conversationId) {
        setError(data.message ?? "Não foi possível iniciar a conversa.");
        return;
      }
      router.push(`/ong/conversas/${data.conversationId}`);
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        loading={loading}
        loadingLabel="ABRINDO..."
        onClick={() => void start()}
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        Conversar
        <span className="sr-only"> com {adopterName}</span>
      </Button>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
