"use client";

import { BrutalButton } from "@/components/brutal-button";
import { Button, iconSize, type ButtonProps } from "@/components/ui";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = Omit<
  ButtonProps,
  "onClick" | "loading" | "loadingLabel" | "children"
> & {
  /** Estilo das telas de perfil/dashboard (borda fina), no lugar do soft UI. */
  brutal?: boolean;
};

export function LogoutButton({
  variant = "outline",
  size = "sm",
  brutal = false,
  ...props
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (brutal) {
    return (
      <BrutalButton
        variant="outline"
        size="md"
        loading={isLoggingOut}
        loadingLabel="SAINDO..."
        onClick={() => void handleLogout()}
        className={props.className}
      >
        <LogOut className={iconSize.md} aria-hidden="true" />
        Sair
      </BrutalButton>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      loading={isLoggingOut}
      loadingLabel="SAINDO..."
      onClick={() => void handleLogout()}
      {...props}
    >
      <LogOut className={iconSize.md} aria-hidden="true" />
      Sair
    </Button>
  );
}
