"use client";
import { Button, FormError, Input, Textarea } from "@/components/ui";
import { workflowMutations } from "@/lib/api/workflows";
import type { FollowupResponse } from "@/lib/backend/contracts";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ReasonSheet } from "./reason-sheet";

/** Go accepts changes to the due date and instructions only in these states. */
export const EDITABLE_FOLLOWUP_STATUSES = ["scheduled", "changes_requested"];
/** Go cancels any follow-up that is not already closed or cancelled. */
export const CANCELLABLE_FOLLOWUP_STATUSES = [
  "scheduled",
  "submitted",
  "changes_requested",
];

/** ISO instant as the local `datetime-local` value the input expects. */
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type FollowupEditFormProps = {
  followup: FollowupResponse;
  onDone: () => void;
};

function FollowupEditForm({ followup, onDone }: FollowupEditFormProps) {
  const update = useMutation(workflowMutations.updateFollowup());
  const initialDue = toLocalInput(followup.dueAt);
  const [dueAt, setDueAt] = useState(initialDue);
  const [instructions, setInstructions] = useState(followup.instructions);
  const [error, setError] = useState<string | null>(null);
  const trimmed = instructions.trim();
  const isDueChanged = dueAt !== initialDue;
  const isInstructionsChanged = trimmed !== followup.instructions.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (update.isPending) return;
    if (!isDueChanged && !isInstructionsChanged) {
      setError("Altere o prazo ou as orientações antes de salvar.");
      return;
    }
    const due = new Date(dueAt);
    if (
      isDueChanged &&
      (Number.isNaN(due.getTime()) || due.getTime() <= Date.now())
    ) {
      setError("Escolha uma data e hora no futuro.");
      return;
    }
    setError(null);
    update.mutate(
      {
        id: followup.id,
        dueAt: isDueChanged ? due.toISOString() : undefined,
        instructions: isInstructionsChanged ? trimmed : undefined,
      },
      { onSuccess: onDone },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border-t border-border-light pt-4"
    >
      <h2 className="text-lg font-bold">Alterar acompanhamento</h2>
      <p className="text-sm text-neutral-600">
        O adotante verá o novo prazo e as novas orientações.
      </p>
      <Input
        id="followup-edit-due"
        type="datetime-local"
        label="Prazo para o relato"
        required
        value={dueAt}
        onChange={(event) => setDueAt(event.target.value)}
      />
      <Textarea
        id="followup-edit-instructions"
        label="O que o adotante deve informar"
        required
        minLength={5}
        maxLength={5000}
        value={instructions}
        onChange={(event) => setInstructions(event.target.value)}
      />
      <FormError id="followup-edit-error">
        {error ?? update.error?.message}
      </FormError>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={update.isPending}
          onClick={onDone}
        >
          Voltar
        </Button>
        <Button
          type="submit"
          loading={update.isPending}
          disabled={!dueAt || trimmed.length < 5}
        >
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}

type FollowupManagementProps = { followup: FollowupResponse };

/**
 * Organization managers (`can_manage_applications`) reschedule, reword or
 * cancel a follow-up. Never render this for the adopter.
 */
export function FollowupManagement({ followup }: FollowupManagementProps) {
  const cancel = useMutation(workflowMutations.cancelFollowup());
  const [isEditing, setIsEditing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const canEdit = EDITABLE_FOLLOWUP_STATUSES.includes(followup.status);
  const canCancel = CANCELLABLE_FOLLOWUP_STATUSES.includes(followup.status);
  if (!canEdit && !canCancel) return null;
  return (
    <>
      {isEditing && canEdit ? (
        <FollowupEditForm
          key={`${followup.dueAt}-${followup.instructions}`}
          followup={followup}
          onDone={() => setIsEditing(false)}
        />
      ) : (
        <div className="flex flex-wrap gap-2 border-t border-border-light pt-4">
          {canEdit ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Alterar prazo ou orientações
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              variant="danger-ghost"
              onClick={() => setIsCancelling(true)}
            >
              Cancelar acompanhamento
            </Button>
          ) : null}
        </div>
      )}
      {isCancelling ? (
        <ReasonSheet
          title="Cancelar acompanhamento"
          description="O adotante não precisará mais enviar relatos para este acompanhamento. Relatos já enviados continuam no histórico. Esta ação não pode ser desfeita."
          label="Motivo do cancelamento"
          confirmLabel="Cancelar acompanhamento"
          maxLength={2000}
          isBusy={cancel.isPending}
          error={cancel.error?.message}
          onConfirm={(reason) =>
            cancel.mutateAsync({ id: followup.id, reason })
          }
          onClose={() => {
            setIsCancelling(false);
            cancel.reset();
          }}
        />
      ) : null}
    </>
  );
}
