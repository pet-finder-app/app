"use client";
import { Button, FormError, Textarea } from "@/components/ui";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "@/components/ui/bottom-sheet";
import { donationMutations } from "@/lib/api/donations";
import type { DonationResponse } from "@/lib/backend/contracts";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import {
  formatBrl,
  MAX_DECISION_REASON,
  MIN_DECISION_REASON,
} from "./donation-format";
import { donorLabel } from "./donor-label";

type DonationDecisionSheetProps = {
  donation: Pick<
    DonationResponse,
    "id" | "amountCents" | "anonymous" | "donorName"
  >;
  status: "confirmed" | "not_found";
  onClose: () => void;
};

const COPY = {
  confirmed: {
    title: "Confirmar recebimento",
    body: "Confirme apenas se o valor já aparece no extrato da ONG. A decisão é definitiva e fica no histórico da doação.",
    reasonLabel: "Como a transferência foi conferida",
    action: "Confirmar recebimento",
  },
  not_found: {
    title: "Marcar como não localizada",
    body: "Use quando a transferência não aparece no extrato da ONG. A decisão é definitiva e a pessoa doadora verá o motivo informado.",
    reasonLabel: "Motivo para a pessoa doadora",
    action: "Marcar como não localizada",
  },
} as const;

/** Confirmation sheet for `POST /v1/donations/{id}/decision`. */
export function DonationDecisionSheet({
  donation,
  status,
  onClose,
}: DonationDecisionSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const decide = useMutation(donationMutations.decide());
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[status];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (decide.isPending) return;
    const trimmed = reason.trim();
    if (trimmed.length < MIN_DECISION_REASON) {
      setError(`Escreva pelo menos ${MIN_DECISION_REASON} caracteres.`);
      return;
    }
    setError(null);
    try {
      await decide.mutateAsync({
        donationId: donation.id,
        status,
        reason: trimmed,
      });
      sheetRef.current?.close();
    } catch (failure: unknown) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível registrar a decisão.",
      );
    }
  }

  return (
    <BottomSheet
      ref={sheetRef}
      title={copy.title}
      isBusy={decide.isPending}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="font-bold">
          {formatBrl(donation.amountCents)} · {donorLabel(donation)}
        </p>
        <p className="text-sm leading-relaxed text-neutral-600">{copy.body}</p>
        <Textarea
          id={`donation-decision-${donation.id}`}
          label={copy.reasonLabel}
          required
          minLength={MIN_DECISION_REASON}
          maxLength={MAX_DECISION_REASON}
          value={reason}
          invalid={Boolean(error)}
          errorId="donation-decision-error"
          onChange={(event) => setReason(event.target.value)}
        />
        <FormError id="donation-decision-error">{error}</FormError>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 shadow-none!"
            disabled={decide.isPending}
            onClick={() => sheetRef.current?.close()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={status === "confirmed" ? "primary" : "danger"}
            className="min-h-11 flex-1 shadow-none!"
            loading={decide.isPending}
          >
            {copy.action}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
