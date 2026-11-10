"use client";

import { Button, FormError, Textarea } from "@/components/ui";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "@/components/ui/bottom-sheet";
import { apiMutations } from "@/lib/api/mutations";
import type { ContentReportInput } from "@/lib/report";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Flag, MoreVertical } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

type FeedPostMenuProps = {
  targetType: ContentReportInput["targetType"];
  targetId: string;
  petId: string | null;
  isHidden: boolean;
  onHiddenChange: (petId: string, isHidden: boolean) => void;
};

export function FeedPostMenu({
  targetType,
  targetId,
  petId,
  isHidden,
  onHiddenChange,
}: FeedPostMenuProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const reportMutation = useMutation(apiMutations.report());
  const hideMutation = useMutation(apiMutations.hidePet());
  const afterCloseRef = useRef<(() => void) | null>(null);
  const id = `post-menu-${targetType}-${targetId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const isBusy = hideMutation.isPending || reportMutation.isPending;
  const [isReported, setIsReported] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setError(null);
    setIsReporting(false);
    setIsReported(false);
    setIsOpen(true);
  }

  function handleClose() {
    sheetRef.current?.close();
  }

  function handleSheetClose() {
    setIsOpen(false);
    const afterClose = afterCloseRef.current;
    afterCloseRef.current = null;
    afterClose?.();
  }

  async function handleHide() {
    if (!petId || isBusy) return;

    setError(null);
    try {
      const data = await hideMutation.mutateAsync({
        id: petId,
        hidden: !isHidden,
      });
      const hidden = data.disliked;
      afterCloseRef.current = () => onHiddenChange(petId, hidden);
      handleClose();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a visibilidade deste pet. Tente novamente.",
      );
    }
  }

  async function handleReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    setError(null);
    try {
      await reportMutation.mutateAsync({ targetType, targetId, reason });
      setIsReported(true);
      setReason("");
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a denúncia. Tente novamente.",
      );
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Mais opções da publicação"
        aria-haspopup="dialog"
        onClick={handleOpen}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-text hover:bg-secondary focus-visible:outline-2 focus-visible:outline-accent-tertiary"
      >
        <MoreVertical className="size-5" aria-hidden="true" />
      </button>
      {isOpen ? (
        <BottomSheet
          ref={sheetRef}
          title={isReporting ? "Denunciar publicação" : "Opções da publicação"}
          isBusy={isBusy}
          onClose={handleSheetClose}
        >
          {isReported ? (
            <div role="status" className="flex flex-col gap-3">
              <p>
                Sua denúncia foi registrada. Obrigado por ajudar a cuidar da
                comunidade.
              </p>
              <Button onClick={() => handleClose()}>Concluir</Button>
            </div>
          ) : isReporting ? (
            <form onSubmit={handleReport} className="flex flex-col gap-4">
              <Textarea
                id={`${id}-reason`}
                label="Por que você está denunciando esta publicação?"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                minLength={10}
                maxLength={2000}
                hint="Descreva o problema em pelo menos 10 caracteres."
                errorId={`${id}-error`}
                invalid={Boolean(error)}
              />
              <Button type="submit" loading={isBusy} loadingLabel="Enviando…">
                Enviar denúncia
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-1">
              {petId && !isHidden ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleHide()}
                  className="flex min-h-14 items-center gap-3 rounded-2xl px-3 text-left hover:bg-secondary focus-visible:outline-2 focus-visible:outline-accent-tertiary disabled:opacity-60"
                >
                  {isHidden ? (
                    <Eye className="size-5" aria-hidden="true" />
                  ) : (
                    <EyeOff className="size-5" aria-hidden="true" />
                  )}
                  {isBusy
                    ? "Atualizando…"
                    : isHidden
                      ? "Mostrar este pet novamente"
                      : "Ocultar este pet"}
                </button>
              ) : null}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setIsReporting(true)}
                className="flex min-h-14 items-center gap-3 rounded-2xl px-3 text-left text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700 disabled:opacity-60"
              >
                <Flag className="size-5" aria-hidden="true" />
                Denunciar publicação
              </button>
            </div>
          )}
          <FormError id={`${id}-error`}>{error}</FormError>
        </BottomSheet>
      ) : null}
    </>
  );
}
