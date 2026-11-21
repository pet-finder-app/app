"use client";
import { Button } from "@/components/ui";
import type { PaymentDetails } from "@/lib/backend/contracts";
import { useEffect, useState } from "react";

type PaymentInstructionsProps = { details: PaymentDetails };

/** Direct-transfer data published by the organization, with a PIX copy action. */
export function PaymentInstructions({ details }: PaymentInstructionsProps) {
  return (
    <section
      aria-labelledby="payment-instructions"
      className="flex flex-col gap-3 rounded-2xl border border-border-light p-4"
    >
      <h2 id="payment-instructions" className="text-lg font-bold">
        {details.method === "pix" ? "Doe por PIX" : "Doe por transferência"}
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {details.method === "pix" && details.pixKey ? (
          <>
            <dt className="font-bold">Chave PIX</dt>
            <dd className="break-all">{details.pixKey}</dd>
          </>
        ) : null}
        {details.method === "bank_transfer" ? (
          <>
            <dt className="font-bold">Banco</dt>
            <dd>{details.bankName ?? "Não informado"}</dd>
            <dt className="font-bold">Agência</dt>
            <dd>{details.bankBranch ?? "Não informada"}</dd>
            <dt className="font-bold">Conta</dt>
            <dd className="break-all">
              {details.bankAccount ?? "Não informada"}
            </dd>
          </>
        ) : null}
        <dt className="font-bold">Titular</dt>
        <dd>{details.accountHolder}</dd>
      </dl>
      {details.method === "pix" && details.pixKey ? (
        <CopyPixKey pixKey={details.pixKey} />
      ) : null}
      <p className="text-sm whitespace-pre-wrap">{details.instructions}</p>
      <p className="text-sm text-neutral-600">
        Confira o nome do titular no aplicativo do seu banco antes de concluir a
        transferência.
      </p>
    </section>
  );
}

type CopyState = "idle" | "copied" | "failed";

function CopyPixKey({ pixKey }: { pixKey: string }) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 3000);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixKey);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" onClick={() => void handleCopy()}>
        Copiar chave PIX
      </Button>
      <p role="status" aria-live="polite" className="text-sm">
        {state === "copied" ? "Chave PIX copiada." : null}
        {state === "failed"
          ? "Não foi possível copiar. Selecione a chave e copie manualmente."
          : null}
      </p>
    </div>
  );
}
