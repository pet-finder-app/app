"use client";
import { Button } from "@/components/ui";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "@/components/ui/bottom-sheet";
import { useRef } from "react";

type PersonalVerificationLossDialogProps = {
  /** Current Go personal verification status: "verified" or "pending". */
  status: string;
  isBusy: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** Personal verification statuses that Go resets when the profile changes. */
export const isPersonalVerificationAtRisk = (status: string) =>
  status === "verified" || status === "pending";

/**
 * Warns that saving the personal profile resets identity verification. Go
 * applies the status change; this only informs.
 */
export function PersonalVerificationLossDialog({
  status,
  isBusy,
  onConfirm,
  onClose,
}: PersonalVerificationLossDialogProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const isVerified = status === "verified";
  return (
    <BottomSheet
      ref={sheetRef}
      title={
        isVerified
          ? "Você perderá a verificação"
          : "A análise da verificação será perdida"
      }
      isBusy={isBusy}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-neutral-600">
          {isVerified
            ? "Ao alterar seu perfil pessoal, sua identidade deixa de constar como verificada e o selo some do seu perfil e dos seus pedidos de adoção."
            : "Seus documentos estão em análise. Ao alterar seu perfil pessoal, a análise não poderá ser aprovada com os dados antigos."}{" "}
          Depois de salvar, envie novamente os documentos de verificação.
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
