import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { NgoVerificationChecklistCard } from "@/components/ngo/ngo-verification-checklist-card";
import { PetForm } from "@/components/pets/pet-form";
import { PageShell } from "@/components/ui";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cadastrar pet – Petfinder",
};

export default async function NewPetPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");
  if (user.ngo.verification.status !== "verified") {
    return (
      <PageShell hasActionBar>
        <NgoVerificationChecklistCard
          ngo={user.ngo}
          blockedAction="cadastrar pets e fazer posts"
        />
        <NgoTabBar />
      </PageShell>
    );
  }

  return <PetForm mode="create" />;
}
