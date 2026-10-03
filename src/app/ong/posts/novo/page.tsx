import { OngTabBar } from "@/components/ong-tab-bar";
import { OngVerificationChecklistCard } from "@/components/ong-verification-checklist-card";
import { PostForm } from "@/components/post-form";
import { PageShell } from "@/components/ui";
import { listPetsByOng } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Novo post – Petfinder",
};

export default async function NewPostPage() {
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

  const pets = (await listPetsByOng(user.id)).filter((pet) => !pet.archived);

  return (
    <PostForm
      mode="create"
      pets={pets.map((pet) => ({ id: pet.id, name: pet.name }))}
    />
  );
}
