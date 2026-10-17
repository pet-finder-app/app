import { TermDocument } from "@/components/agreements/term-document";
import { LinkButton } from "@/components/ui";
import { PrintButton } from "@/components/ui/print-button";
import { getAdoptionById } from "@/lib/adoptions";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Termo de adoção – Petfinder",
};

/** Printable adoption agreement and signature evidence, accessible only to the two parties. */
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
    (adoption.ngoId !== user.id && adoption.adopterId !== user.id)
  ) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 bg-white p-6 text-neutral-900 print:p-0">
      <div className="flex flex-wrap gap-2 print:hidden">
        <LinkButton
          href={
            adoption.ngoId === user.id
              ? `/ngo/adoptions/${adoption.id}`
              : `/adopter/adoptions/${adoption.id}`
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
