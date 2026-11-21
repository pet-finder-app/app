"use client";
import {
  documentHref,
  formatDate,
  SUBMISSION_STATUS_LABELS,
} from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { Button, FormError, Textarea } from "@/components/ui";
import { apiMutations } from "@/lib/api/mutations";
import { verificationReviewOptions } from "@/lib/api/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

type Decision = "under_review" | "approved" | "rejected";
type VerificationReviewProps = { id: string };

export function VerificationReview({ id }: VerificationReviewProps) {
  const query = useQuery(verificationReviewOptions(id));
  const review = useMutation(apiMutations.reviewVerification());
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const item = query.data;
  const isOpen =
    item && ["submitted", "under_review"].includes(item.verification.status);

  async function decide(decision: Decision) {
    if (review.isPending) return;
    setError(null);
    if (reason.trim().length < 5) {
      setError("Explique a decisão com pelo menos 5 caracteres.");
      return;
    }
    try {
      await review.mutateAsync({ id, decision, reason: reason.trim() });
      setReason("");
      await query.refetch();
    } catch (failure: unknown) {
      setError(
        failure instanceof Error && failure.message
          ? failure.message
          : "Não foi possível registrar a decisão.",
      );
    }
  }

  return (
    <>
      <QueryStatus query={query} />
      {item ? (
        <>
          <p>
            {item.organizationId ? "Organização" : "Pessoa"} ·{" "}
            {SUBMISSION_STATUS_LABELS[item.verification.status] ??
              item.verification.status}{" "}
            · enviada em {formatDate(item.verification.createdAt)}
          </p>
          {item.verification.evidence.notes ? (
            <p>Observações: {item.verification.evidence.notes}</p>
          ) : null}
          <h2 className="text-lg font-bold">Documentos</h2>
          <ul>
            {item.verification.evidence.documents.map((url, index) => (
              <li key={url}>
                <a href={documentHref(url)} className="underline">
                  Documento {index + 1}
                </a>
              </li>
            ))}
          </ul>
          <h2 className="text-lg font-bold">Dados no momento do envio</h2>
          <pre className="overflow-x-auto rounded-xl bg-secondary p-3 text-xs whitespace-pre-wrap">
            {JSON.stringify(item.profile, null, 2)}
          </pre>
          {item.verification.reason ? (
            <p>Último parecer: {item.verification.reason}</p>
          ) : null}
          {isOpen ? (
            <div className="flex flex-col gap-3">
              <Textarea
                id="verification-reason"
                label="Parecer"
                value={reason}
                minLength={5}
                maxLength={2000}
                onChange={(event) => setReason(event.target.value)}
              />
              <FormError id="verification-review-error">{error}</FormError>
              <Button
                loading={review.isPending}
                onClick={() => void decide("approved")}
              >
                Aprovar
              </Button>
              {item.verification.status === "submitted" ? (
                <Button
                  variant="outline"
                  disabled={review.isPending}
                  onClick={() => void decide("under_review")}
                >
                  Marcar como em análise
                </Button>
              ) : null}
              <Button
                variant="danger-ghost"
                disabled={review.isPending}
                onClick={() => void decide("rejected")}
              >
                Recusar
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}
