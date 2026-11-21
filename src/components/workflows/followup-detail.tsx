"use client";
import { formatDate } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import {
  Button,
  Card,
  FormError,
  LinkButton,
  Select,
  Textarea,
} from "@/components/ui";
import { applicationOptions } from "@/lib/api/queries";
import {
  followupOptions,
  workflowMutations,
  type FollowupDecision,
  type WelfareStatus,
} from "@/lib/api/workflows";
import type { FollowupResponse } from "@/lib/backend/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { canManageOrganization, type ViewerAccess } from "./access";
import { EvidenceLinks } from "./evidence-links";
import { EvidenceUpload, type UploadedEvidence } from "./evidence-upload";
import { FollowupManagement } from "./followup-management";
import {
  FOLLOWUP_DECISION_LABELS,
  FOLLOWUP_STATUS_LABELS,
  options,
  WELFARE_LABELS,
} from "./labels";

const welfareSchema = z.enum(["good", "needs_attention", "urgent"]);

function ReportForm({ followupId }: { followupId: string }) {
  const submit = useMutation(workflowMutations.submitFollowupReport());
  const [notes, setNotes] = useState("");
  const [welfare, setWelfare] = useState<WelfareStatus>("good");
  const [photos, setPhotos] = useState<UploadedEvidence[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submit.isPending || isUploading || notes.trim().length < 10) return;
    submit.mutate(
      {
        id: followupId,
        notes: notes.trim(),
        welfareStatus: welfare,
        mediaIds: photos.map((photo) => photo.id),
      },
      {
        onSuccess: () => {
          setNotes("");
          setPhotos([]);
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border-t border-border-light pt-4"
    >
      <h2 className="text-lg font-bold">Enviar relato</h2>
      <Select
        id="followup-welfare"
        label="Como está o animal?"
        value={welfare}
        onChange={(event) =>
          setWelfare(welfareSchema.parse(event.target.value))
        }
        options={options(WELFARE_LABELS)}
      />
      <Textarea
        id="followup-notes"
        label="Relato"
        required
        minLength={10}
        maxLength={10000}
        rows={6}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        hint="Conte sobre a adaptação, saúde e rotina. Mínimo de 10 caracteres."
      />
      <EvidenceUpload
        id="followup-photos"
        label="Fotos (opcional)"
        purpose="followup"
        value={photos}
        onChange={setPhotos}
        onBusyChange={setIsUploading}
      />
      <FormError id="followup-report-error">{submit.error?.message}</FormError>
      <Button
        type="submit"
        loading={submit.isPending}
        disabled={isUploading || notes.trim().length < 10}
      >
        Enviar relato
      </Button>
    </form>
  );
}

function ReviewForm({ followupId }: { followupId: string }) {
  const review = useMutation(workflowMutations.reviewFollowup());
  const [reason, setReason] = useState("");
  const decisions: { value: FollowupDecision; label: string }[] = [
    { value: "closed", label: "Encerrar acompanhamento" },
    { value: "changes_requested", label: "Pedir ajustes" },
  ];
  return (
    <section className="flex flex-col gap-3 border-t border-border-light pt-4">
      <h2 className="text-lg font-bold">Analisar relato</h2>
      <Textarea
        id="followup-review-reason"
        label="Parecer para o adotante"
        required
        minLength={5}
        maxLength={3000}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {decisions.map((decision) => (
          <Button
            key={decision.value}
            variant={decision.value === "closed" ? "primary" : "outline"}
            disabled={review.isPending || reason.trim().length < 5}
            onClick={() =>
              review.mutate(
                {
                  id: followupId,
                  decision: decision.value,
                  reason: reason.trim(),
                },
                { onSuccess: () => setReason("") },
              )
            }
          >
            {decision.label}
          </Button>
        ))}
      </div>
      <FormError id="followup-review-error">{review.error?.message}</FormError>
    </section>
  );
}

type HistoryEntry =
  | { type: "report"; at: string; report: FollowupResponse["reports"][number] }
  | { type: "review"; at: string; review: FollowupResponse["reviews"][number] };

function FollowupHistory({ followup }: { followup: FollowupResponse }) {
  const entries: HistoryEntry[] = [
    ...followup.reports.map((report): HistoryEntry => ({
      type: "report",
      at: report.submittedAt,
      report,
    })),
    ...followup.reviews.map((review): HistoryEntry => ({
      type: "review",
      at: review.reviewedAt,
      review,
    })),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return (
    <section aria-labelledby="followup-history" className="flex flex-col gap-3">
      <h2 id="followup-history" className="text-lg font-bold">
        Histórico
      </h2>
      {entries.length ? null : <p>Nenhum relato enviado ainda.</p>}
      <ol className="flex flex-col gap-3">
        {entries.map((entry) =>
          entry.type === "report" ? (
            <li
              key={`report-${entry.report.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border-light p-3"
            >
              <p className="font-semibold">
                Relato do adotante · {formatDate(entry.at)}
              </p>
              <p className="text-sm">
                {WELFARE_LABELS[entry.report.welfareStatus] ??
                  "Bem-estar não informado"}
              </p>
              <p className="whitespace-pre-wrap">{entry.report.notes}</p>
              <EvidenceLinks
                ids={entry.report.mediaIds}
                label="Fotos do relato"
                variant="images"
              />
            </li>
          ) : (
            <li
              key={`review-${entry.at}-${entry.review.decision}`}
              className="flex flex-col gap-1 rounded-2xl bg-secondary p-3"
            >
              <p className="font-semibold">
                {FOLLOWUP_DECISION_LABELS[entry.review.decision] ??
                  "Análise da ONG"}{" "}
                · {formatDate(entry.at)}
              </p>
              <p className="whitespace-pre-wrap">{entry.review.reason}</p>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

type FollowupDetailProps = {
  applicationId: string;
  followupId: string;
  access: ViewerAccess;
};

/** A follow-up task: adopter reports and organization reviews. */
export function FollowupDetail({
  applicationId,
  followupId,
  access,
}: FollowupDetailProps) {
  const followup = useQuery(followupOptions(followupId));
  const application = useQuery(applicationOptions(applicationId));
  const data = followup.data;
  const app = application.data?.application;
  if (!data || !app)
    return (
      <>
        <QueryStatus query={followup} />
        <QueryStatus query={application} />
      </>
    );
  if (data.applicationId !== applicationId)
    return <p role="alert">Este acompanhamento não pertence a este pedido.</p>;
  const isAdopter = app.adopterId === access.userId;
  const canManage = canManageOrganization(access, app.organizationId);
  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-2">
        <p className="font-bold">
          {FOLLOWUP_STATUS_LABELS[data.status] ?? "Situação não informada"}
        </p>
        <p>
          Adoção de {app.animalName} · ONG {app.organizationName}
        </p>
        <p>Prazo: {formatDate(data.dueAt)}</p>
        {data.closedAt ? (
          <p>
            {data.status === "cancelled" ? "Cancelado" : "Encerrado"} em{" "}
            {formatDate(data.closedAt)}
          </p>
        ) : null}
        {data.status === "cancelled" && data.cancellationReason ? (
          <p className="whitespace-pre-wrap">
            <span className="font-semibold">Motivo do cancelamento: </span>
            {data.cancellationReason}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap">
          <span className="font-semibold">Orientações da ONG: </span>
          {data.instructions}
        </p>
      </Card>
      <LinkButton
        variant="outline"
        href={`/${isAdopter ? "adopter" : "ngo"}/adoptions/${encodeURIComponent(applicationId)}`}
      >
        Voltar ao pedido
      </LinkButton>
      <FollowupHistory followup={data} />
      {isAdopter && ["scheduled", "changes_requested"].includes(data.status) ? (
        <ReportForm followupId={followupId} />
      ) : null}
      {canManage && data.status === "submitted" ? (
        <ReviewForm followupId={followupId} />
      ) : null}
      {canManage && !isAdopter ? <FollowupManagement followup={data} /> : null}
      {!isAdopter && !canManage ? (
        <p role="note">
          Somente o adotante envia relatos e somente quem gerencia pedidos da
          ONG pode analisá-los.
        </p>
      ) : null}
    </div>
  );
}
