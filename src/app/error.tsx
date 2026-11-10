"use client";
import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="m-auto flex max-w-lg flex-col gap-4 p-6" role="alert">
      <h1 className="text-xl font-bold">Não foi possível carregar os dados</h1>
      <p>O serviço está indisponível no momento. Tente novamente.</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
