"use client";
import { Button } from "@/components/ui";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "@/components/ui/bottom-sheet";
import { useRef } from "react";

type VerificationLossDialogProps = {
  /** What is changing, in Portuguese, such as "o nome da ONG". */
  change: string;
  isBusy: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Warns a verified organization that the change it is about to save sends it
 * back to verification. Go applies the status change; this only informs.
 */
export function VerificationLossDialog({
  change,
  isBusy,
  onConfirm,
  onClose,
}: VerificationLossDialogProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  return (
    <BottomSheet
      ref={sheetRef}
      title="A ONG perderá a verificação"
      isBusy={isBusy}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-neutral-600">
          Ao alterar {change}, a ONG volta para a situação &quot;Em
          análise&quot; e perde o selo de verificada. Até uma nova aprovação da
          equipe Petfinder, ela não poderá publicar animais, receber novos
          pedidos nem aprovar adoções. Depois de salvar, envie novamente os
          documentos de verificação.
        </p>
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
            type="button"
            variant="danger"
            className="min-h-11 flex-1 shadow-none!"
            loading={isBusy}
            onClick={onConfirm}
          >
            Alterar mesmo assim
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
