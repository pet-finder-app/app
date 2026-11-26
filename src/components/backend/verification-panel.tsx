"use client";
import { Button, FileInput, FormError, Textarea } from "@/components/ui";
import {
  apiMutations,
  DOCUMENT_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/api/mutations";
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
import { VerificationTimeline } from "./verification-timeline";

type VerificationPanelProps = {
  /** Omit for the signed-in person; Go requires member management otherwise. */
  organizationId?: string;
  /** Go's overall status; omit where the surrounding control already shows it. */
  statusLabel?: string;
  /** Hide the section heading when a sheet title already names it. */
  hasHeading?: boolean;
  /** Called after Go accepts a submission, e.g. to refresh server-rendered status. */
  onSubmitted?: () => void;
};

/** Submit identity evidence for administrator review and follow its history. */
export function VerificationPanel({
  organizationId,
  statusLabel,
  hasHeading = true,
  onSubmitted,
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
  const records = [...(history.data?.items ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const latest = records[0] ?? null;
  const isAwaitingReview = records.some((record) =>
    ["submitted", "under_review"].includes(record.status),
  );
  const prefix = organizationId ? "organization" : "personal";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      onSubmitted?.();
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
      <h2
        id={`${prefix}-verification-title`}
        className={hasHeading ? "text-lg font-bold" : "sr-only"}
      >
        Verificação
      </h2>
      {statusLabel ? <p role="status">{statusLabel}</p> : null}
      <QueryStatus query={requirements} />
      <QueryStatus query={history} />
      {history.data ? <VerificationTimeline latest={latest} /> : null}
      {!isAwaitingReview && requirements.data ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <h3 className="font-bold">
            {latest ? "Enviar novos documentos" : "Documentos"}
          </h3>
          {required.map((kind) => (
            <FileInput
              key={kind}
              id={`${prefix}-verification-${kind}`}
              label={DOCUMENT_LABELS[kind] ?? kind}
              hint="PDF, JPEG, PNG ou WebP, até 10 MB."
              accept={DOCUMENT_TYPES.join(",")}
              maxSize={MAX_UPLOAD_BYTES}
              disabled={submit.isPending}
              value={files[kind] ?? null}
              invalid={Boolean(error) && !files[kind]}
              errorId={`${prefix}-verification-error`}
              onChange={(file) => setFiles({ ...files, [kind]: file })}
            />
          ))}
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
        <h3 className="font-bold">Histórico de envios</h3>
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
