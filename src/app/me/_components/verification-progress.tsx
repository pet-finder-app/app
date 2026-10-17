"use client";

import { Button, Progress } from "@/components/ui";
import {
  ADOPTER_SECTION_LABEL,
  type AdopterChecklistItem,
  type AdopterProfile,
  type AdopterProfileSection,
} from "@/lib/adopter";
import { ArrowRight, BadgeCheck, Clock3 } from "lucide-react";

type VerificationProgressProps = {
  checklist: AdopterChecklistItem[];
  status: AdopterProfile["verification"]["status"];
  isReadyForReview: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  onOpenSection: (section: AdopterProfileSection) => void;
  onSubmitForReview: () => void;
};

/** Show required-data completion separately from the account's review status. */
export function VerificationProgress({
  checklist,
  status,
  isReadyForReview,
  isSaving,
  hasChanges,
  onOpenSection,
  onSubmitForReview,
}: VerificationProgressProps) {
  const completed = checklist.filter((item) => item.done).length;
  const percentage =
    checklist.length > 0 ? Math.round((completed / checklist.length) * 100) : 0;
  const nextItem = checklist.find((item) => !item.done);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-neutral-600">
          {completed} de {checklist.length} etapas concluídas
        </p>
        <span className="font-semibold text-text">{percentage}%</span>
      </div>
      <Progress
        value={completed}
        max={checklist.length}
        label="Dados preenchidos para verificação"
      />
      {hasChanges ? (
        <p className="text-xs text-neutral-600">
          Progresso inclui alterações ainda não salvas.
        </p>
      ) : null}
      {status === "verified" ? (
        <p className="flex items-center gap-2 text-sm font-medium text-accent-tertiary">
          <BadgeCheck className="size-5 shrink-0" aria-hidden="true" />
          Seu perfil já está verificado.
        </p>
      ) : status === "under_review" ? (
        <div className="flex items-start gap-2 text-sm text-neutral-600">
          <Clock3
            className="mt-0.5 size-5 shrink-0 text-text"
            aria-hidden="true"
          />
          <p>
            <span className="block font-medium text-text">
              Perfil em análise
            </span>
            Seus dados foram enviados. Aguarde a conclusão da verificação.
          </p>
        </div>
      ) : status === "suspended" ? (
        <p className="text-sm text-neutral-600">
          <span className="block font-medium text-text">Perfil suspenso</span>
          Consulte as orientações em Verificação do perfil. Completar os dados
          não altera a suspensão.
        </p>
      ) : nextItem ? (
        <button
          type="button"
          aria-haspopup="dialog"
          disabled={isSaving}
          onClick={() => onOpenSection(nextItem.section)}
          className="flex w-full items-center gap-3 rounded-xl bg-secondary p-3 text-left focus-visible:outline-2 focus-visible:outline-accent-tertiary disabled:opacity-60"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-neutral-600">
              Próximo passo
            </span>
            <span className="mt-1 block text-sm font-semibold text-text">
              {nextItem.label}
            </span>
            {nextItem.missing ? (
              <span className="mt-1 block text-xs text-neutral-600">
                Falta: {nextItem.missing}.
              </span>
            ) : null}
            <span className="mt-2 block text-xs font-medium text-text">
              Abrir {ADOPTER_SECTION_LABEL[nextItem.section]}
            </span>
          </span>
          <ArrowRight
            className="size-5 shrink-0 text-text"
            aria-hidden="true"
          />
        </button>
      ) : status === "pending" ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-neutral-600">
            <span className="block font-medium text-text">
              Próximo passo: enviar para análise
            </span>
            Você completou os dados necessários. Envie seu perfil para solicitar
            a verificação.
          </p>
          <Button
            type="button"
            disabled={!isReadyForReview || isSaving}
            loading={isSaving}
            loadingLabel="ENVIANDO..."
            onClick={onSubmitForReview}
          >
            Enviar para verificação
          </Button>
        </div>
      ) : null}
    </div>
  );
}
