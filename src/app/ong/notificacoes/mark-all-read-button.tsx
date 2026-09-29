"use client";

import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkAllReadButton() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleClick() {
    setIsSaving(true);
    try {
      await fetch("/api/ong/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      loading={isSaving}
      loadingLabel="MARCANDO..."
      onClick={handleClick}
    >
      Marcar tudo como lido
    </Button>
  );
}
