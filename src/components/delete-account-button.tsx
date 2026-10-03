"use client";

import { Button, FormError, iconSize } from "@/components/ui";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ERROR_ID = "delete-account-error";

/**
 * Excluir a própria conta (LGPD): pede confirmação, apaga os dados pessoais e
 * volta ao login. Vale para adotante e ONG.
 */
export function DeleteAccountButton({ isOng = false }: { isOng?: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Não foi possível excluir a conta.");
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

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirming(true)}
        className="self-start"
      >
        <Trash2 className={iconSize.md} aria-hidden="true" />
        Excluir minha conta
      </Button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label="Confirmar exclusão da conta"
      className="flex flex-col gap-2"
    >
      <p className="text-sm text-neutral-900">
        Isso apaga seu cadastro
        {isOng
          ? ", seus pets e seus posts"
          : ", seus favoritos e suas curtidas"}{" "}
        e não pode ser desfeito. Registros de adoções já feitas (termos
        assinados) são mantidos por obrigação legal.
      </p>
      <FormError id={ERROR_ID}>{error}</FormError>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setConfirming(false)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          className="flex-1"
          loading={deleting}
          loadingLabel="EXCLUINDO..."
          onClick={() => void handleDelete()}
        >
          Sim, excluir
        </Button>
      </div>
    </div>
  );
}
