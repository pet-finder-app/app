"use client";
import { Button, FormError, Textarea } from "@/components/ui";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "@/components/ui/bottom-sheet";
import { useRef, useState, type FormEvent, type ReactNode } from "react";

type ReasonSheetProps = {
  id: string;
  title: string;
  confirmLabel: string;
  reasonLabel: string;
  isDanger?: boolean;
  isBusy: boolean;
  error?: string | null;
  /** Extra fields shown above the reason, such as a destination choice. */
  children?: ReactNode;
  isConfirmDisabled?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

/** Confirmation sheet for lifecycle actions that Go records with a 5–1000 character reason. */
export function ReasonSheet({
  id,
  title,
  confirmLabel,
  reasonLabel,
  isDanger,
  isBusy,
  error,
  children,
  isConfirmDisabled,
  onConfirm,
  onClose,
}: ReasonSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [reason, setReason] = useState("");
  const isReasonValid = reason.trim().length >= 5;
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || !isReasonValid || isConfirmDisabled) return;
    onConfirm(reason.trim());
  }
  return (
    <BottomSheet ref={sheetRef} title={title} isBusy={isBusy} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {children}
        <Textarea
          id={`${id}-reason`}
          label={reasonLabel}
          required
          minLength={5}
          maxLength={1000}
          value={reason}
          hint="Entre 5 e 1000 caracteres. O motivo fica registrado no histórico."
          onChange={(event) => setReason(event.target.value)}
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
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={isDanger ? "danger" : "primary"}
            className="min-h-11 flex-1 shadow-none!"
            loading={isBusy}
            disabled={!isReasonValid || isConfirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
