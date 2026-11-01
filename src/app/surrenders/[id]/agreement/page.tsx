import { TermDocument } from "@/components/agreements/term-document";
import { PrintButton } from "@/components/ui/print-button";
import { getSurrenderById } from "@/lib/surrenders";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Termo de entrega do pet – Petfinder",
};

/** Surrender agreement for reading, printing, or saving as PDF. Accessible only to the two parties. */
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
    (surrender.ngoId !== user.id && surrender.adopterId !== user.id)
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
        roleLabel={{ ngo: "ONG", adopter: "Tutor" }}
      />
    </main>
  );
}
