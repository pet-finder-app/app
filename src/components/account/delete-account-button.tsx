"use client";
import { Button, FormError, MenuButton, PasswordInput } from "@/components/ui";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "@/components/ui/bottom-sheet";
import { accountErrorMessage, accountMutations } from "@/lib/api/account";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

const ERROR_ID = "delete-account-error";

/** MenuList row that confirms the password, then deactivates the account in Go. */
export function DeleteAccountButton() {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const remove = useMutation(accountMutations.deleteAccount());
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (remove.isPending) return;
    setError(null);
    if (!password) {
      setError("Informe sua senha para confirmar.");
      return;
    }
    try {
      await remove.mutateAsync({ password });
      // Go revoked every session; a hard navigation drops the stale cookies' state.
      window.location.replace(new URL("/login", window.location.origin));
    } catch (failure: unknown) {
      setError(accountErrorMessage(failure, "delete"));
    }
  }

  return (
    <MenuButton
      icon={Trash2}
      tone="danger"
      aria-haspopup="dialog"
      onClick={() => {
        setError(null);
        setPassword("");
        setIsOpen(true);
      }}
      dialog={
        isOpen ? (
          <BottomSheet
            ref={sheetRef}
            title="Excluir conta?"
            isBusy={remove.isPending}
            onClose={() => setIsOpen(false)}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-neutral-600">
                Sua conta será desativada, todas as sessões serão encerradas e
                você sairá das ONGs de que participa. Pedidos de adoção, doações
                e registros de bem-estar animal são mantidos para histórico. Se
                você for a única pessoa que administra uma ONG, transfira a
                gestão antes.
              </p>
              <PasswordInput
                id="delete-account-password"
                label="Senha atual"
                autoComplete="current-password"
                required
                maxLength={72}
                value={password}
                invalid={Boolean(error)}
                errorId={ERROR_ID}
                onChange={(event) => setPassword(event.target.value)}
              />
              <FormError id={ERROR_ID}>{error}</FormError>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1 shadow-none!"
                  disabled={remove.isPending}
                  onClick={() => sheetRef.current?.close()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  className="min-h-11 flex-1 shadow-none!"
                  loading={remove.isPending}
                >
                  Excluir conta
                </Button>
              </div>
            </form>
          </BottomSheet>
        ) : null
      }
    >
      Excluir minha conta
    </MenuButton>
  );
}
