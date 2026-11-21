"use client";
import { formatDate } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { Button, FormError, Input, Textarea } from "@/components/ui";
import {
  applicationFollowupsOptions,
  workflowMutations,
} from "@/lib/api/workflows";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FOLLOWUP_STATUS_LABELS } from "./labels";

type FollowupPanelProps = {
  applicationId: string;
  /** Organization managers schedule, reschedule and cancel follow-ups. */
  canSchedule: boolean;
  isApplicant: boolean;
};

function ScheduleForm({ applicationId }: { applicationId: string }) {
  const schedule = useMutation(workflowMutations.scheduleFollowup());
  const [dueAt, setDueAt] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (schedule.isPending) return;
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime()) || due.getTime() <= Date.now()) {
      setError("Escolha uma data e hora no futuro.");
      return;
    }
    setError(null);
    schedule.mutate(
      {
        applicationId,
        dueAt: due.toISOString(),
        instructions: instructions.trim(),
      },
      {
        onSuccess: () => {
          setDueAt("");
          setInstructions("");
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border-t border-border-light pt-4"
    >
      <h3 className="font-bold">Agendar acompanhamento</h3>
      <Input
        id="followup-due"
        type="datetime-local"
        label="Prazo para o relato"
        required
        value={dueAt}
        onChange={(event) => setDueAt(event.target.value)}
      />
      <Textarea
        id="followup-instructions"
        label="O que o adotante deve informar"
        required
        minLength={5}
        maxLength={5000}
        value={instructions}
        onChange={(event) => setInstructions(event.target.value)}
        hint="Por exemplo: como está a adaptação, saúde e fotos recentes."
      />
      <FormError id="followup-schedule-error">
        {error ?? schedule.error?.message}
      </FormError>
      <Button
        type="submit"
        loading={schedule.isPending}
        disabled={!dueAt || instructions.trim().length < 5}
      >
        Agendar
      </Button>
      {schedule.isSuccess ? (
        <p role="status">Acompanhamento agendado. O adotante será avisado.</p>
      ) : null}
    </form>
  );
}

/** Post-adoption follow-up tasks of a completed adoption. */
export function FollowupPanel({
  applicationId,
  canSchedule,
  isApplicant,
}: FollowupPanelProps) {
  const query = useQuery(applicationFollowupsOptions(applicationId));
  const items = query.data?.items ?? [];
  return (
    <section
      aria-labelledby="followups-title"
      className="flex flex-col gap-3 border-t border-border-light pt-4"
    >
      <h2 id="followups-title" className="text-lg font-bold">
        Acompanhamento pós-adoção
      </h2>
      <QueryStatus query={query} />
      {query.data && !items.length ? (
        <p>
          {isApplicant
            ? "A ONG ainda não agendou nenhum acompanhamento."
            : "Nenhum acompanhamento agendado."}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/adoptions/${encodeURIComponent(applicationId)}/follow-ups/${encodeURIComponent(item.id)}`}
              className="block rounded-2xl border border-border-light p-3 hover:bg-primary-faint focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="block font-semibold">
                {FOLLOWUP_STATUS_LABELS[item.status] ??
                  "Situação não informada"}
              </span>
              <span className="block text-sm">
                Prazo: {formatDate(item.dueAt)} · {item.reports.length}{" "}
                {item.reports.length === 1 ? "relato" : "relatos"}
              </span>
              {item.status === "cancelled" && item.cancellationReason ? (
                <span className="block text-sm whitespace-pre-wrap">
                  Motivo do cancelamento: {item.cancellationReason}
                </span>
              ) : null}
              {canSchedule &&
              !isApplicant &&
              item.status !== "closed" &&
              item.status !== "cancelled" ? (
                <span className="block text-sm text-neutral-600">
                  Abra para alterar o prazo ou cancelar.
                </span>
              ) : null}
              {isApplicant &&
              ["scheduled", "changes_requested"].includes(item.status) ? (
                <span className="block text-sm font-semibold text-lime-800">
                  Enviar relato
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      {canSchedule ? <ScheduleForm applicationId={applicationId} /> : null}
    </section>
  );
}
