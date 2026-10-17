"use client";

import { Button, FormError, iconSize, type ButtonProps } from "@/components/ui";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "@/components/ui/bottom-sheet";
import { BrutalButton } from "@/components/ui/brutal-button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type LogoutButtonProps = Omit<
  ButtonProps,
  "onClick" | "loading" | "loadingLabel" | "children"
> & {
  /** Use the thin-border profile/dashboard styling. */
  brutal?: boolean;
  /** Ask for confirmation in a modal before ending the session. */
  confirm?: boolean;
};

export function LogoutButton({
  variant = "outline",
  size = "sm",
  brutal = false,
  confirm = false,
  ...props
}: LogoutButtonProps) {
  const router = useRouter();
  const id = useId();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConfirming) cancelRef.current?.focus();
  }, [isConfirming]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setError(null);
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Não foi possível sair da conta. Tente novamente.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  function handlePress() {
    setError(null);
    if (confirm) setIsConfirming(true);
    else void handleLogout();
  }

  const trigger = brutal ? (
    <BrutalButton
      variant="outline"
      size="md"
      loading={!confirm && isLoggingOut}
      loadingLabel="SAINDO..."
      onClick={handlePress}
      className={props.className}
      aria-haspopup={confirm ? "dialog" : undefined}
    >
      <LogOut className={iconSize.md} aria-hidden="true" />
      Sair
    </BrutalButton>
  ) : (
    <Button
      type="button"
      variant={variant}
      size={size}
      loading={!confirm && isLoggingOut}
      loadingLabel="SAINDO..."
      onClick={handlePress}
      aria-haspopup={confirm ? "dialog" : undefined}
      {...props}
    >
      <LogOut className={iconSize.md} aria-hidden="true" />
      Sair
    </Button>
  );

  return (
    <>
      {trigger}
      {!confirm && error ? (
        <FormError id={`${id}-error`}>{error}</FormError>
      ) : null}
      {isConfirming ? (
        <BottomSheet
          ref={sheetRef}
          title="Sair da conta?"
          isBusy={isLoggingOut}
          onClose={() => setIsConfirming(false)}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-neutral-600">
              Você sairá desta sessão. Para voltar, entre novamente com seu
              e-mail e senha.
            </p>
            <FormError id={`${id}-error`}>{error}</FormError>
            <div className="flex gap-3">
              <Button
                ref={cancelRef}
                type="button"
                variant="outline"
                className="min-h-11 flex-1 shadow-none!"
                disabled={isLoggingOut}
                onClick={() => sheetRef.current?.close()}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                className="min-h-11 flex-1 shadow-none!"
                loading={isLoggingOut}
                loadingLabel="SAINDO..."
                onClick={() => void handleLogout()}
              >
                <LogOut className={iconSize.md} aria-hidden="true" />
                Sair
              </Button>
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
