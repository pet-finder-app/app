import { OngTabBar } from "@/components/ong-tab-bar";
import { OngVerificationChecklistCard } from "@/components/ong-verification-checklist-card";
import { PetForm } from "@/components/pet-form";
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
  if (user.role !== "ong" || !user.ong) redirect("/");
  if (user.ong.verification.status !== "verificada") {
    return (
      <PageShell hasActionBar>
        <OngVerificationChecklistCard
          ong={user.ong}
          blockedAction="cadastrar pets e fazer posts"
        />
        <OngTabBar />
      </PageShell>
    );
  }

  return <PetForm mode="create" />;
}
