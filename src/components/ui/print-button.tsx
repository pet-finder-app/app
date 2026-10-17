"use client";

import { Printer } from "lucide-react";
import { Button } from ".";

/** Open the browser print dialog, which also supports saving as PDF. */
export function PrintButton() {
  return (
    <Button variant="outline" size="md" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden="true" />
      Imprimir ou salvar em PDF
    </Button>
  );
}
