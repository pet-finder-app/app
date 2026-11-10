import { PageShell } from "@/components/ui";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de uso – Petfinder" };

export default function TermsPage() {
  return (
    <PageShell width="lg">
      <h1 className="text-2xl font-bold">
        Termos de uso e política de privacidade
      </h1>
      <p>
        Os documentos revisados ainda não estão disponíveis nesta interface.
      </p>
    </PageShell>
  );
}
