"use client";

import { Button, type ButtonProps } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = Omit<
  ButtonProps,
  "onClick" | "loading" | "loadingLabel" | "children"
>;

export function LogoutButton({
  variant = "outline",
  size = "sm",
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
      Sair
    </Button>
  );
}
