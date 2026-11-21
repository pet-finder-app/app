import { PageShell } from "@/components/ui";
import { getLegalDocument } from "@/lib/backend/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de uso – Petfinder" };

export default async function TermsPage() {
  const documents = await Promise.all([
    getLegalDocument("terms"),
    getLegalDocument("privacy"),
  ]);
  return (
    <PageShell width="lg">
      <h1 className="text-2xl font-bold">
        Termos de uso e política de privacidade
      </h1>
      {documents.map((document, index) =>
        document ? (
          <article key={document.id} className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">{document.title}</h2>
            <p className="text-sm">
              Versão {document.version} · vigente desde{" "}
              {new Date(document.effectiveAt).toLocaleDateString("pt-BR")}
            </p>
            {document.placeholder ? (
              <p role="note" className="font-medium">
                Texto provisório: a versão revisada ainda será publicada.
              </p>
            ) : null}
            <div className="whitespace-pre-wrap">{document.content}</div>
          </article>
        ) : (
          <p key={index}>
            {index === 0
              ? "Os termos de uso não puderam ser carregados."
              : "A política de privacidade não pôde ser carregada."}{" "}
            Tente novamente mais tarde.
          </p>
        ),
      )}
    </PageShell>
  );
}
