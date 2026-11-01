"use client";

import { FormError } from "@/components/ui";
import { ConfirmButton } from "@/components/workflows/process-cards";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Start an NGO adoption process from a conversation. */
export function StartAdoptionButton({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/adoptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = (await response.json()) as {
        adoption?: { id: string };
        message?: string;
      };
      if (!response.ok || !data.adoption) {
        setError(data.message ?? "Não foi possível iniciar.");
        return;
      }
      router.push(`/ngo/adoptions/${data.adoption.id}`);
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <ConfirmButton
        label="Iniciar adoção"
        question="A pessoa vai receber uma ficha de adoção para preencher e você poderá aprovar, pedir ajustes ou recusar. O pet fica reservado para ela. Iniciar agora?"
        confirmLabel="Sim, iniciar"
        size="sm"
        busy={busy}
        onConfirm={() => start()}
      />
      <FormError id="start-adoption-error" collapsible className="text-xs">
        {error}
      </FormError>
    </div>
  );
}
