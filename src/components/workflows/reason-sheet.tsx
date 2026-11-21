"use client";
import { Button, FormError, Textarea } from "@/components/ui";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "@/components/ui/bottom-sheet";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";

type ReasonSheetProps = {
  title: string;
  description: ReactNode;
  label: string;
  confirmLabel: string;
  minLength?: number;
  maxLength?: number;
  isBusy: boolean;
  error?: string | null;
  /** Resolves when Go accepted the action; the sheet then closes itself. */
  onConfirm: (reason: string) => Promise<unknown>;
  onClose: () => void;
};

/** Confirmation sheet for irreversible actions that Go records with a reason. */
export function ReasonSheet({
  title,
  description,
  label,
  confirmLabel,
  minLength = 5,
  maxLength = 1000,
  isBusy,
  error,
  onConfirm,
  onClose,
}: ReasonSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const id = useId();
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || trimmed.length < minLength) return;
    try {
      await onConfirm(trimmed);
      sheetRef.current?.close();
    } catch {
      // The mutation error is shown through `error`.
    }
  }

  return (
    <BottomSheet ref={sheetRef} title={title} isBusy={isBusy} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="text-sm leading-relaxed text-neutral-600">
          {description}
        </div>
        <Textarea
          id={`${id}-reason`}
          label={label}
          required
          minLength={minLength}
          maxLength={maxLength}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          hint={`Entre ${minLength} e ${maxLength} caracteres.`}
          errorId={`${id}-error`}
        />
        <FormError id={`${id}-error`}>{error}</FormError>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 shadow-none!"
            disabled={isBusy}
            onClick={() => sheetRef.current?.close()}
          >
            Voltar
          </Button>
          <Button
            type="submit"
            variant="danger"
            className="min-h-11 flex-1 shadow-none!"
            loading={isBusy}
            disabled={trimmed.length < minLength}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
