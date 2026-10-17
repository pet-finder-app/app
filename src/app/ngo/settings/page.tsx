import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NgoProfileForm } from "./_components/ngo-profile-form";

export const metadata: Metadata = {
  title: "Configurações – Petfinder",
};

export default async function EditNgoProfilePage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  return <NgoProfileForm initialProfile={user.ngo} />;
}
