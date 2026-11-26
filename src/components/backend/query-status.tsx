"use client";
import { Button, FormError } from "@/components/ui";
import { useId } from "react";

type QueryStatusProps = {
  query: { isPending: boolean; error: Error | null; refetch: () => unknown };
  /** Set false when the page shows its own loading indicator. */
  hasPendingText?: boolean;
};
export function QueryStatus({
  query,
  hasPendingText = true,
}: QueryStatusProps) {
  const errorId = useId();
  if (query.error)
    return (
      <div className="flex flex-col gap-2">
        <FormError id={errorId}>{query.error.message}</FormError>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  return hasPendingText && query.isPending ? (
    <p role="status">Carregando...</p>
  ) : null;
}
