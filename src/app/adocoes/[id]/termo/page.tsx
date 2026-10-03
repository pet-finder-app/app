import { TermDocument } from "@/components/term-document";
import { LinkButton } from "@/components/ui";
import { getAdoptionById } from "@/lib/adoptions";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
  title: "Termo de adoção – Petfinder",
};

/**
 * Termo para ler, imprimir ou salvar como PDF (pelo menu de impressão do
 * navegador). Só as duas partes veem. Inclui a página de comprovação das
 * assinaturas (quem, quando, de onde, e a identificação única do documento).
 */
export default async function TermPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user) redirect("/login");

  const adoption = await getAdoptionById(id);
  if (
    !adoption?.term ||
    (adoption.ongId !== user.id && adoption.adopterId !== user.id)
  ) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 bg-white p-6 text-neutral-900 print:p-0">
      <div className="flex flex-wrap gap-2 print:hidden">
        <LinkButton
          href={
            adoption.ongId === user.id
              ? `/ong/adocoes/${adoption.id}`
              : `/adotante/adocoes/${adoption.id}`
          }
          variant="pill"
          size="md"
        >
          Voltar para a adoção
        </LinkButton>
        <PrintButton />
      </div>

      <TermDocument term={adoption.term} />
    </main>
  );
}
