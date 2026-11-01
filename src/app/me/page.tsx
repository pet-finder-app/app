import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdopterProfileForm } from "./_components/adopter-profile-form";
import { NgoProfile } from "./_components/ngo-profile";

export const metadata: Metadata = {
  title: "Meu perfil – Petfinder",
};

/** Render the signed-in account's personal or organization profile. */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user) redirect("/login");

  if (user.role === "ngo" && user.ngo) {
    const { created } = await searchParams;
    return <NgoProfile userId={user.id} ngo={user.ngo} created={created} />;
  }

  if (user.role === "adopter" && user.adopter) {
    return (
      <AdopterProfileForm
        initialProfile={user.adopter}
        accountAvatarUrl={user.avatarUrl}
      />
    );
  }

  redirect("/login");
}
