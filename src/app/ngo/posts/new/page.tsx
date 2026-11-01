import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { NgoVerificationChecklistCard } from "@/components/ngo/ngo-verification-checklist-card";
import { PostForm } from "@/components/posts/post-form";
import { PageShell } from "@/components/ui";
import { listPetsByNgo } from "@/lib/pets";
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

  const pets = (await listPetsByNgo(user.id)).filter((pet) => !pet.archived);

  return (
    <PostForm
      mode="create"
      pets={pets.map((pet) => ({ id: pet.id, name: pet.name }))}
    />
  );
}
