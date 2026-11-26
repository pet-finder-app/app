import { cn, iconSize } from "@/components/ui";
import type { VerificationRecord } from "@/lib/backend/contracts";
import { Check, X } from "lucide-react";
import { formatDate } from "./labels";

type StepState = "done" | "current" | "failed" | "upcoming";

type TimelineStep = {
  key: "submission" | "review" | "result";
  title: string;
  description: string;
  detail?: string;
  state: StepState;
};

const STATE_LABELS: Record<StepState, string> = {
  done: "Concluída",
  current: "Etapa atual",
  failed: "Recusada",
  upcoming: "Pendente",
};

/** Map Go's latest submission onto the three stages of the review process. */
function verificationSteps(latest: VerificationRecord | null): TimelineStep[] {
  const submission: TimelineStep = latest
    ? {
        key: "submission",
        title: "Envio dos documentos",
        description: `Enviados em ${formatDate(latest.createdAt)}.`,
        state: "done",
      }
    : {
        key: "submission",
        title: "Envio dos documentos",
        description: "Envie os documentos solicitados abaixo.",
        state: "current",
      };
  const review = (state: StepState, description: string): TimelineStep => ({
    key: "review",
    title: "Análise da equipe Petfinder",
    description,
    state,
  });
  const pendingResult: TimelineStep = {
    key: "result",
    title: "Resultado",
    description: "Você será notificado quando houver uma decisão.",
    state: "upcoming",
  };

  switch (latest?.status) {
    case undefined:
      return [
        submission,
        review("upcoming", "A equipe confere os documentos enviados."),
        pendingResult,
      ];
    case "approved":
      return [
        submission,
        review("done", "Análise concluída."),
        {
          key: "result",
          title: "Aprovada",
          description: `Verificação aprovada em ${formatDate(latest.reviewedAt)}.`,
          state: "done",
        },
      ];
    case "rejected":
      return [
        submission,
        review("done", "Análise concluída."),
        {
          key: "result",
          title: "Recusada",
          description: `Verificação recusada em ${formatDate(latest.reviewedAt)}. Corrija o que foi apontado e envie novamente.`,
          detail: latest.reason ? `Parecer: ${latest.reason}` : undefined,
          state: "failed",
        },
      ];
    case "under_review":
      return [
        submission,
        review("current", "Seus documentos estão sendo analisados."),
        pendingResult,
      ];
    default:
      // "submitted" and any status Go adds later wait in the review queue.
      return [
        submission,
        review("current", "Na fila para análise."),
        pendingResult,
      ];
  }
}

type VerificationTimelineProps = {
  /** Most recent submission, or null before the first one. */
  latest: VerificationRecord | null;
};

/** Vertical timeline of the verification process for the latest submission. */
export function VerificationTimeline({ latest }: VerificationTimelineProps) {
  const steps = verificationSteps(latest);
  return (
    <ol aria-label="Etapas da verificação" className="flex flex-col">
      {steps.map((step, index) => (
        <li
          key={step.key}
          aria-current={step.state === "current" ? "step" : undefined}
          className="relative flex gap-3 pb-5 last:pb-0"
        >
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-7 bottom-0 left-3.5 w-0.5 -translate-x-1/2",
                step.state === "done"
                  ? "bg-accent-tertiary"
                  : "bg-border-light",
              )}
            />
          ) : null}
          <StepMarker state={step.state} />
          <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            <p
              className={cn(
                "font-bold",
                step.state === "upcoming" && "text-neutral-500",
                step.state === "failed" && "text-red-700",
              )}
            >
              {step.title}
              <span className="sr-only"> ({STATE_LABELS[step.state]})</span>
            </p>
            <p className="text-sm text-neutral-600">{step.description}</p>
            {step.detail ? (
              <p className="text-sm font-medium break-words text-text">
                {step.detail}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepMarker({ state }: { state: StepState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
        state === "done" && "bg-accent-tertiary text-white",
        state === "failed" && "bg-red-700 text-white",
        state === "current" && "border-2 border-accent-tertiary bg-white",
        state === "upcoming" && "border-2 border-border-light bg-white",
      )}
    >
      {state === "done" ? (
        <Check className={iconSize.md} strokeWidth={3} />
      ) : state === "failed" ? (
        <X className={iconSize.md} strokeWidth={3} />
      ) : state === "current" ? (
        <span className="size-2.5 rounded-full bg-accent-tertiary motion-safe:animate-pulse" />
      ) : null}
    </span>
  );
}
