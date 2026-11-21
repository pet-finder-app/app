"use client";
import { Button, FormError, Textarea } from "@/components/ui";
import { apiMutations, DOCUMENT_TYPES } from "@/lib/api/mutations";
import {
  verificationHistoryOptions,
  verificationRequirementsOptions,
} from "@/lib/api/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  DOCUMENT_LABELS,
  documentHref,
  formatDate,
  SUBMISSION_STATUS_LABELS,
} from "./labels";
import { QueryStatus } from "./query-status";

type VerificationPanelProps = {
  /** Omit for the signed-in person; Go requires member management otherwise. */
  organizationId?: string;
  statusLabel: string;
};

/** Submit identity evidence for administrator review and follow its history. */
export function VerificationPanel({
  organizationId,
  statusLabel,
}: VerificationPanelProps) {
  const requirements = useQuery(
    verificationRequirementsOptions(organizationId),
  );
  const history = useQuery(verificationHistoryOptions(organizationId));
  const submit = useMutation(apiMutations.submitVerification());
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const required = requirements.data?.requiredDocuments ?? [];
  const records = history.data?.items ?? [];
  const isAwaitingReview = records.some((record) =>
    ["submitted", "under_review"].includes(record.status),
  );
  const prefix = organizationId ? "organization" : "personal";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (submit.isPending) return;
    setError(null);
    const selected = required.map((kind) => files[kind] ?? null);
    if (selected.some((file) => file === null)) {
      setError("Envie todos os documentos solicitados.");
      return;
    }
    try {
      await submit.mutateAsync({
        organizationId,
        files: selected.filter((file): file is File => file !== null),
        notes,
      });
      setFiles({});
      setNotes("");
      form.reset();
    } catch (failure: unknown) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível enviar a verificação.",
      );
    }
  }

  return (
    <section
      aria-labelledby={`${prefix}-verification-title`}
      className="flex flex-col gap-3"
    >
      <h2 id={`${prefix}-verification-title`} className="text-lg font-bold">
        Verificação
      </h2>
      <p role="status">{statusLabel}</p>
      <QueryStatus query={requirements} />
      <QueryStatus query={history} />
      {isAwaitingReview ? (
        <p>
          Seus documentos aguardam a análise da equipe Petfinder. Você será
          notificado quando houver uma decisão.
        </p>
      ) : requirements.data ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {required.map((kind) => (
            <label
              key={kind}
              className="flex flex-col gap-1 text-sm font-medium"
            >
              {DOCUMENT_LABELS[kind] ?? kind}
              <input
                type="file"
                required
                accept={DOCUMENT_TYPES.join(",")}
                className="text-sm"
                onChange={(event) =>
                  setFiles({
                    ...files,
                    [kind]: event.target.files?.[0] ?? null,
                  })
                }
              />
            </label>
          ))}
          <p className="text-xs">PDF, JPEG, PNG ou WebP, até 10 MB cada.</p>
          <Textarea
            id={`${prefix}-verification-notes`}
            label="Observações para a análise (opcional)"
            value={notes}
            maxLength={5000}
            onChange={(event) => setNotes(event.target.value)}
          />
          <FormError id={`${prefix}-verification-error`}>{error}</FormError>
          <Button type="submit" loading={submit.isPending}>
            Enviar para verificação
          </Button>
        </form>
      ) : null}
      {records.length ? (
        <ul
          aria-label="Histórico de verificação"
          className="flex flex-col gap-2"
        >
          {records.map((record) => (
            <li
              key={record.id}
              className="rounded-xl border border-border-light p-3"
            >
              <p className="font-medium">
                {SUBMISSION_STATUS_LABELS[record.status] ?? record.status} ·{" "}
                {formatDate(record.createdAt)}
              </p>
              {record.reason ? <p>Parecer: {record.reason}</p> : null}
              <ul className="text-sm">
                {record.evidence.documents.map((url, index) => (
                  <li key={url}>
                    <a href={documentHref(url)} className="underline">
                      Documento {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
