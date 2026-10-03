"use client";

import { Button } from "@/components/ui";
import { Printer } from "lucide-react";

/** Abre a impressão do navegador (de lá dá para "Salvar como PDF"). */
export function PrintButton() {
  return (
    <Button variant="outline" size="md" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden="true" />
      Imprimir ou salvar em PDF
    </Button>
  );
}
