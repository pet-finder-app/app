import { TermDocument } from "@/components/term-document";
import { getSurrenderById } from "@/lib/surrenders";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "../../../adocoes/[id]/termo/print-button";

export const metadata: Metadata = {
  title: "Termo de entrega do pet – Petfinder",
};

/**
 * Termo de entrega do pet à ONG, para ler, imprimir ou salvar como PDF. Só as
 * duas partes veem. Mesmo formato do termo de adoção.
 */
export default async function SurrenderTermPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user) redirect("/login");

  const surrender = await getSurrenderById(id);
  if (
    !surrender?.term ||
    (surrender.ongId !== user.id && surrender.adopterId !== user.id)
  ) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 bg-white p-6 text-neutral-900 print:p-0">
      <div className="print:hidden">
        <PrintButton />
      </div>
      <TermDocument
        term={surrender.term}
        roleLabel={{ ong: "ONG", adopter: "Tutor" }}
      />
    </main>
  );
}
