"use client";

import {
  Button,
  cn,
  FormError,
  iconSize,
  type ButtonProps,
} from "@/components/ui";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "@/components/ui/bottom-sheet";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ERROR_ID = "delete-account-error";

type DeleteAccountButtonProps = {
  isNgo?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  confirmation?: "inline" | "modal";
};

/** Confirm account deletion, remove personal data, and return to login. Supports both account types. */
export function DeleteAccountButton({
  isNgo = false,
  variant = "outline",
  size = "md",
  className,
  confirmation = "inline",
}: DeleteAccountButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  async function handleDelete() {
    if (deleting) return;
    setError(null);
    setDeleting(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const data: unknown = await response.json();
        setError(
          typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof data.message === "string"
            ? data.message
            : "Não foi possível excluir a conta.",
        );
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setDeleting(false);
    }
  }

  const trigger = (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => {
        setError(null);
        setConfirming(true);
      }}
      className={cn("self-start", className)}
      aria-haspopup="dialog"
    >
      <Trash2 className={iconSize.md} aria-hidden="true" />
      Excluir minha conta
    </Button>
  );

  const confirmationContent = (
    <div
      role={confirmation === "inline" ? "alertdialog" : undefined}
      aria-labelledby="delete-account-title"
      aria-describedby="delete-account-description"
      aria-busy={deleting}
      className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
    >
      <h3
        id="delete-account-title"
        className="text-base font-bold text-red-700"
      >
        {confirmation === "modal"
          ? "Esta ação é permanente"
          : "Excluir sua conta?"}
      </h3>
      <p
        id="delete-account-description"
        className="text-sm leading-relaxed text-text"
      >
        Isso apaga seu cadastro
        {isNgo
          ? ", seus pets e seus posts"
          : ", seus favoritos e suas curtidas"}{" "}
        e não pode ser desfeito. Registros de adoções já feitas (termos
        assinados) são mantidos por obrigação legal.
      </p>
      <FormError id={ERROR_ID}>{error}</FormError>
      <div className="flex gap-2">
        <Button
          ref={cancelRef}
          type="button"
          variant="outline"
          className="min-h-11 flex-1 shadow-none!"
          disabled={deleting}
          onClick={() => {
            if (confirmation === "modal") sheetRef.current?.close();
            else setConfirming(false);
          }}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          className="min-h-11 flex-1 shadow-none!"
          loading={deleting}
          loadingLabel="EXCLUINDO..."
          onClick={() => void handleDelete()}
        >
          Sim, excluir
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {confirmation === "modal" || !confirming ? trigger : null}
      {confirming ? (
        confirmation === "modal" ? (
          <BottomSheet
            ref={sheetRef}
            title="Excluir minha conta?"
            isBusy={deleting}
            onClose={() => setConfirming(false)}
          >
            {confirmationContent}
          </BottomSheet>
        ) : (
          confirmationContent
        )
      ) : null}
    </>
  );
}
