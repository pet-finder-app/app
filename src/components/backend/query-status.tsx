"use client";
import { Button, FormError } from "@/components/ui";
import { useId } from "react";

type QueryStatusProps = {
  query: { isPending: boolean; error: Error | null; refetch: () => unknown };
};
export function QueryStatus({ query }: QueryStatusProps) {
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
  return query.isPending ? <p role="status">Carregando...</p> : null;
}
